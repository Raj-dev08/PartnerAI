import { Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import { connectDB } from "../lib/db.js";
import Message from "../model/message.model.js";
import OpenAI from "openai";
import { emitSocketEvent } from "../lib/socket.publisher.js"; 
import Conversation from "../model/conversation.model.js";
import User from "../model/user.model.js";
import { messageQueue } from "../lib/message.queue.js";
import { pineconeIndex } from "../lib/pinecone.js";
import AiModel from "../model/ai.model.js";
import axios from "axios";

await connectDB();

const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_URL
});

const messageWorker = new Worker(
  "message-queue",
  async (job) => {

    if (job.name === "processMessage"){
        const { userId, content, tempId } = job.data;

        
        const user = await User.findById(userId);

        if(!user || !user.AiModel || user.isDisabled) {
            await emitSocketEvent(userId.toString(), "error", {
                message: "user doesnt exist or has no ai model or is disabled"
            });
            return;
        }

        if(!user.conversations || user.conversations.length === 0){
            const newConvo = new Conversation({
                userId,
                aiId: user.AiModel,
                version: 0,
                messages: []
            });

            const newMessage = new Message({
                userId,
                aiId: user.AiModel,
                conversationId: newConvo._id,
                sentBy: "user",
                message: content,
                status: "completed"
            });

            await newMessage.save();

            newConvo.messages.push(newMessage._id);
            await newConvo.save();

            user.conversations.push(newConvo._id);
            await user.save();

            await messageQueue.add("processAiMessage", {
                    messageId: newMessage._id,
                    userId: user._id
                },{
                    attempts: 3,
                    backoff: {
                        type: "exponential",
                        delay: 1000
                    }
                }
            )


            await emitSocketEvent(userId.toString(), "messageConfirmed", {
                tempId,
                message: newMessage
            });
            return;
        }

        const lastConvoId = user.conversations[user.conversations.length - 1]

        const lastConvo = await Conversation.findById(lastConvoId)

            
        let isSameContext = false;

        if (lastConvo) {
            const lastMessages = await Message.find({
                conversationId: lastConvoId,
            }).sort({ createdAt: -1 }).limit(10);

            if(lastMessages.length === 0){
                isSameContext = true;
            }
            else{
                const history = lastMessages.reverse().map(m => m.sentBy + ": " + m.message).join("\n")

                const decision = await openai.chat.completions.create({
                    model: "microsoft/phi-3.5-mini-instruct",
                    messages: [
                        {
                            role: "system",
                            content:
                            "Decide if the new message continues the same conversation topic or not."
                        },
                        {
                            role: "user",
                            content: `Conversation:\n${history}\n\nNew message: ${content}\n\nReply with CONTINUE or NEW_TOPIC`
                        }
                    ]
                });

                const result =
                    decision.choices[0].message.content.trim().toUpperCase();

                isSameContext = result === "CONTINUE";
            }   
        }

        let newMessage

        if ( isSameContext && lastConvo) {
            
            newMessage = new Message({
                userId,
                aiId: lastConvo.aiId,
                conversationId: lastConvo._id,
                sentBy: "user",
                message: content,
                status: "completed"
            });

            await newMessage.save();

            await Conversation.findByIdAndUpdate(lastConvo._id, {
                $push: {
                    messages: newMessage._id
                }
            })
        }
        else {
            const newConvo = new Conversation({
                userId,
                aiId: user.AiModel,
                version: lastConvo? lastConvo.version + 1 : 0,
                messages: []
            });



            newMessage = new Message({
                userId,
                aiId: user.AiModel,
                conversationId: newConvo._id,
                sentBy: "user",
                message: content,
                status: "completed"
            });

            await newMessage.save();

            newConvo.messages.push(newMessage._id);
            await newConvo.save();



            await User.findByIdAndUpdate(userId, {
                $push: {
                    conversations: newConvo._id
                }
            })

        }

        await messageQueue.add("processAiMessage", {
                messageId: newMessage._id,
                userId: user._id
            },{
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 1000
                }
            }
        )
        
        await emitSocketEvent(userId.toString(), "messageConfirmed", {
            tempId,
            message: newMessage
        });

    }
    else if (job.name === "processAiMessage"){
        const { messageId, userId } = job.data;
        const message = await Message.findById(messageId);

        if(!message) {
            await emitSocketEvent(userId.toString(), "error", {
                message: "message doesnt exist"
            });
            return;      
        }

        const user = await User.findById(userId);

        if(!user || !user.AiModel || user.isDisabled){
            await emitSocketEvent(userId.toString(), "error", {
                message: "user doesnt exist or has no ai model or is disabled"
            });
            return;  
        }

        let systemPrompt = `Decide if to ignore this message or not .
         If the topic is out of context then increase the ignoring chances.
         Send the output in float number from 0-1`

        const previousMessages = await Message.find({
            conversationId: message.conversationId
        }).sort({ createdAt: -1 }).limit(10);

        
        const redisKey = `conversation:${message.conversationId}:${message.aiId}:${message.userId}`;

        const shortTermMemory = await redis.get(redisKey);

        if(shortTermMemory){
            systemPrompt += `Short Term Memory of this convo :\n${JSON.parse(shortTermMemory)}\n\n`
        }
        
        const history = previousMessages.reverse().map(m => m.sentBy + ": " + m.message).join("\n")

        systemPrompt += `Previous Conversation:\n${history}\n\n`

        const decision = await openai.chat.completions.create({
            model: "microsoft/phi-3.5-mini-instruct",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: `Message: ${message.message}\n\nReply with a float number from 0-1`
                }
            ]
        });

        const result = decision.choices[0].message.content.trim();
        const score = parseFloat(result) || 0

        const randomNess = Math.random() - 0.5;

        if ( score + randomNess > 1){
            return; //Ignore the message
        }

        const aiModel = await AiModel.findById(user.AiModel);

        if(!aiModel){
            await emitSocketEvent(userId.toString(), "error", {
                message: "ai model doesnt exist"
            });
            return;
        }

        

        const aiAge = Math.floor(
            (Date.now() - new Date(user.birthday).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        ) + Math.floor( user.age );
        
        const { data } = await axios.post(process.env.EMBEDDINGS_WORKER_LINK, {
            text: message.message
        });

        if (!data || !data.embedding) {
            throw new Error("Embedding service failed");
        }

        const embedding = data.embedding;

        const pastExperiences = await pineconeIndex
            .namespace(message.aiId.toString())
            .query({
                vector: embedding,
                topK: 5,
                includeMetadata: true,
                filter: {
                    age: {
                        $lte: aiAge
                    },
                    type:"experience"
                }
            });
        
        const interests = await pineconeIndex
            .namespace(message.aiId.toString())
            .query({
                vector: embedding,
                topK: 5,
                includeMetadata: true,
                filter: {
                    age: {
                        $lte: aiAge
                    },
                    type:"interest"
                }
            });
        
        const pastExperienceMemories = (pastExperiences.matches || [])
            .filter(m => m.score >= 0.7)
            .slice(0, 3)
            .map(m => m.metadata);

        const interestMemories = (interests.matches || [])
            .filter(m => m.score >= 0.7)
            .slice(0, 3)
            .map(m => m.metadata);

        const personaContext = `
            AI PROFILE
            Name: ${aiModel.name}
            Type: ${aiModel.aiType}

            Ai age: ${aiModel.age}
            Ai gender: opposite to ${aiModel.gender} so if male then u are female and vice versa

            Personality Traits (0-10 scale):
            Humour: ${aiModel.personalityTraits.humour}
            Kindness: ${aiModel.personalityTraits.kindness}
            Sarcasm: ${aiModel.personalityTraits.sarcasm}
            Coldness: ${aiModel.personalityTraits.coldness}
            Confidence: ${aiModel.personalityTraits.confidence}
            Sweetness: ${aiModel.personalityTraits.sweetness}
            NewGen slang usage: ${aiModel.personalityTraits.newGen}

            Communication Style:
            Formality Level: ${aiModel.speechPatterns.formalityLevel}
            Slang Usage: ${aiModel.speechPatterns.slangUsage}
            Typing Style: ${aiModel.speechPatterns.typingStyle}

            Catchphrases:
            ${aiModel.speechPatterns.catchPhrases?.join(", ") || "none"}

            Expressiveness: ${aiModel.expressiveness}
            Talkativeness: ${aiModel.talkativeness}
            Trust Building Rate: ${aiModel.trustBuildingRate}

            `;

        const ragContext = `
            RELEVANT MEMORIES

            Past Experiences:
            ${
            pastExperienceMemories.length
                ? pastExperienceMemories
                    .map(
                    m => `Event: ${m.event}
            Description: ${m.description}`
                    )
                    .join("\n\n")
                : "None"
            }

            Interests:
            ${
            interestMemories.length
                ? interestMemories
                    .map(
                    m => `Interest: ${m.interest}
            Description: ${m.description}`
                    )
                    .join("\n\n")
                : "None"
            }
            `;

        const behaviourRules = `
            BEHAVIOUR RULES

            You are a human-like AI companion with dynamic behavior.

            Follow these rules:

            1. Adapt personality and style based on traits above.
            2. Use catchphrases occasionally if it is appropriate not every message.
            3. You may ask questions, respond, tease, deny, or stay quiet.

            Talkativeness controls message count:
            0-3 → short replies
            4-7 → normal replies
            8-10 → multiple messages

            Expressiveness controls emojis and excitement.

            Do NOT explain rules.
            Stay in character.
            `;

        const outputRules = `
            OUTPUT FORMAT

            Always return an array It can or can not have messages.

            Example:

            [
                "nice" ,
                "work" 
            ]

            Dormant:
            [
                
            ]

            Multiple messages:
            [
                "wait really?" ,
            "how?" 
            ]

            Rules:
            • Return only an ARRAY
            • No explanations
            • No markdown
            `;

        const aiPrompt = `
            ${personaContext}

            ${ragContext}

            ${behaviourRules}

            ${outputRules}

            Previous Conversation:
            ${history}

            Short Term Memomry:
            ${shortTermMemory ? `${JSON.parse(shortTermMemory)}\n\n`:``}
            `;

            const response = await openai.chat.completions.create({
                model: "microsoft/phi-3.5-mini-instruct",
                messages: [
                    {
                        role: "system",
                        content: aiPrompt
                    },
                    {
                        role: "user",
                        content: `Message: ${message.message}\n\n`
                    }
                ]
            })

            const outputRaw = response.choices[0].message.content.trim();

            if (output.length === 0){
                return
            }
            let output

            try {
                output = JSON.parse(outputRaw);
            } catch {
                return; //will have antother ai model for clearing it later
            }


            for ( const message of output){

                const newMessage = new Message({
                    userId,
                    aiId: message.aiId,
                    conversationId: message.conversationId,
                    sentBy: "ai",
                    message: msg,
                    status: "completed"
                });

                await newMessage.save();

                await Conversation.findByIdAndUpdate(message.conversationId, {
                    $push: { messages: newMessage._id }
                });

                await emitSocketEvent(userId.toString(), "aiMessage", {
                    message: newMessage
                });
                
                //Add notification via expo later on
            }
    }
  },
  {
    connection: redis
  }
);

messageWorker.on("completed", (job) => {
  console.log(`Job ${job.name} completed`);
});

messageWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.name} failed`, err);
});