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
import axios, { all } from "axios";
import { sendNotificationToExpo } from "../lib/expoPushNotification.js";
import PastExperience from "../model/past.model.js";
import Interest from "../model/interest.model.js";
import { dbQueues } from "../lib/db.queue.js";
import UserReference from "../model/userReference.model.js";
import Memory from "../model/memory.model.js";
import aiMemory from "../model/aimemory.model.js";

await connectDB();

const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_URL
});

//TO-DO : CLEAN IT LATER WITH SEPERATE FUNCTIONS 
//TO-DO : If redis is exploding cuz it has users then add remove on complete in the jobs

const messageWorker = new Worker(
  "message-queue",
  async (job) => {

    if (job.name === "processMessage"){
        const { userId, content, replyingTo, tempId } = job.data;

        
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
                replyingTo,
                message: content,
                status: "completed"
            });

            await newMessage.save();
            await newMessage.populate("replyingTo");

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
                const last_message = lastMessages[0];
                
                const timeDifference = Date.now() - new Date(last_message.createdAt).getTime();
                
                let result = "CONTINUE" 
                if ( timeDifference > 60 * 60 * 1000){
                    const decision = await openai.chat.completions.create({
                        model: "nvidia/nemotron-3-super-120b-a12b",
                        messages: [
                            {
                                role: "system",
                                content:
                                `Decide if the new message continues the same conversation topic or not.`
                            },
                            {
                                role: "user",
                                content: `Conversation:\n${history}\n\nNew message: ${content}\n\nReply with CONTINUE or NEW_TOPIC`
                            }
                        ]
                    });

                    result =
                        decision.choices[0].message.content.trim().toUpperCase();
                }
                

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
                replyingTo,
                message: content,
                status: "completed"
            });

            await newMessage.save();
            await newMessage.populate("replyingTo");


            await Conversation.findByIdAndUpdate(lastConvo._id, {
                $push: {
                    messages: newMessage._id
                }
            })
        }
        else {

            await messageQueue.add("rateConvo",{
                conversationId: lastConvoId,
                userId: user._id,
                aiId: user.AiModel
            },{
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 1000
                }
            })

            await messageQueue.add("updateUserReference",{
                conversationId: lastConvoId,
                userId: user._id,
                aiId: user.AiModel
            }, {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 1000
                }
            })

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
                replyingTo,
                message: content,
                status: "completed"
            });

            await newMessage.save();

            await newMessage.populate("replyingTo");


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
        const message = await Message.findById(messageId).populate("replyingTo");

        if(!message) {
            await emitSocketEvent(userId.toString(), "error", {
                message: "message doesnt exist"
            });
            return;      
        }

        const user = await User.findById(userId).populate("memories");

        if(!user || !user.AiModel || user.isDisabled){
            await emitSocketEvent(userId.toString(), "error", {
                message: "user doesnt exist or has no ai model or is disabled"
            });
            return;  
        }

       let systemPrompt = `
                You are a decision engine for an AI companion system.

                Your job is to analyze the user's message and decide what context is needed to generate the best possible response.

                You MUST return EXACTLY one valid JSON object.

                ---------------------
                DECISION LOGIC
                ---------------------

                Think before answering:

                1. Ignore decision:
                - Set "ignoreScore" high (>=0.5) if:
                • Message is dry, low effort, or not meaningful (e.g. "ok", "hmm", "k")
                • Conversation is one-sided (AI already sent multiple messages)
                • No response would feel more human

                - Set low (<0.5) if:
                • User expects reply
                • Message contains question, emotion, or engagement

                2. Past Experience (AI):
                - "searchPastExperience": yes if message relates to past events, stories, or experiences
                - "tellAllPast": yes ONLY if user explicitly asks for full history or deep explanation

                3. Interests (AI):
                - "interest": yes if message relates to hobbies, likes, preferences
                - "tellAllInterest": yes ONLY if user asks broadly about interests

                4. User Memory:
                - "searchUserMemory": yes if message relates to user’s past behavior, preferences, or facts
                - "searchAllUserMemory": yes ONLY if full context is needed (rare)

                5. AI Memory:
                - "searchAIMemory": yes if response requires:
                • consistency in personality
                • recalling previous AI statements
                • maintaining relationship continuity

                ---------------------
                IMPORTANT RULES
                ---------------------

                - Prefer minimal data usage (don’t fetch everything unless needed)
                - Be selective, not greedy
                - If unsure, choose "no" for heavy operations (tellAll / searchAll)
                - Always return all fields

                ---------------------
                OUTPUT FORMAT
                ---------------------

                {
                "ignoreScore": number (0-1),
                "searchPastExperience": "yes" | "no",
                "interest": "yes" | "no",
                "tellAllPast": "yes" | "no",
                "tellAllInterest": "yes" | "no",
                "searchUserMemory": "yes" | "no",
                "searchAllUserMemory": "yes" | "no",
                "searchAIMemory": "yes" | "no"
                }

                ---------------------
                STRICT RULES
                ---------------------

                - Output MUST be valid JSON
                - No markdown
                - No explanations
                - No extra text
                - No comments
                - No multiple objects

                Failure = invalid response.
                `;
        const previousMessages = await Message.find({
            conversationId: message.conversationId
        }).populate("replyingTo").sort({ createdAt: -1 }).limit(10);

        
        const redisKey = `conversation:${message.conversationId}:${message.aiId}:${message.userId}`;

        const shortTermMemory = await redis.get(redisKey);

        if(shortTermMemory){
            systemPrompt += `Short Term Memory of this convo :\n${shortTermMemory|| ""}\n\n`
        }
        
        const history = previousMessages.reverse().map(m => ` ${m.replyingTo? `Replied to ${m.replyingTo.sentBy} : ${m.replyingTo.message}` : ``} ${m.sentBy} :  ${m.message}`).join("\n")

        systemPrompt += `Previous Conversation:\n${history}\n\n`

        const decision = await openai.chat.completions.create({
            model: "nvidia/nemotron-3-super-120b-a12b",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: `Message: ${message.message} 
                    ${message.replyingTo? `Replied to ${message.replyingTo.sentBy} : ${message.replyingTo.message}` : ``}
                    `
                }
            ]
        });

        let result
        try {
            let raw = decision.choices[0].message.content.trim();

            raw = raw.replace(/```json|```/g, "").trim();

            const match = raw.match(/\{[\s\S]*?\}/);

            if (!match) {
                throw new Error("No JSON found");
            }

            result = JSON.parse(match[0]);
        } catch (err) {
            console.log(err)
            const hardFallBack = {
                ignoreScore: 0.4,
                searchPastExperience: "yes",
                interest: "yes",
                tellAllPast: "no",
                tellAllInterest: "no",
                searchUserMemory: "yes",
                searchAllUserMemory: "no",
                searchAIMemory: "no"
            }
            result = hardFallBack;
        }

        const { ignoreScore, searchPastExperience, interest, tellAllPast, tellAllInterest, searchUserMemory, searchAllUserMemory, searchAIMemory} = result;

        // console.log(result , decision.choices[0].message.content.trim())

        if ( ignoreScore > 0.5){
            console.log("ignoring",ignoreScore)
            const delayMs = (Math.random() * 5 ) * 60 * 60 * 1000 + Math.random() * 60 * 60 * 1000;
            await messageQueue.add("startNewConvo", {
                userId,
                messageId // toDetermine if they talked after or not
            },{
                delay: delayMs
            })//make a new message after random delay
            return
        }

        //IGNORE MECHANICS TILL NOW

        const msgLockKey = `msg-lock:${user._id}`; // Lock the message for a certain time so message spam gets blocked

        const isLocked = await redis.set(msgLockKey, "1", "NX", "EX", 10); // Lock for 10 seconds

        if(!isLocked){
            console.log("skipped back to back msgs")
            return
        }

        const aiModel = await AiModel.findById(user.AiModel);

        if(!aiModel){
            await emitSocketEvent(userId.toString(), "error", {
                message: "ai model doesnt exist"
            });
            return;
        }

        await emitSocketEvent(userId.toString(), "aiStartedTyping", {
            aiId:aiModel._id.toString()
        })

        console.log(result)

        
        let pastExperiences;
        let interests;
        let userMemories;

        const aiAge = Math.floor(
            (Date.now() - new Date(user.birthday).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        ) + Math.floor( aiModel.age );

        if ( searchPastExperience === "yes" || interest === "yes" || searchUserMemory === "yes") {
            const { data } = await axios.post(process.env.EMBEDDINGS_WORKER_LINK, {
                text: message.message
            });

            if (!data || !data.embedding) {
                throw new Error("Embedding service failed");
            }

            const embedding = data.embedding;

            if(searchPastExperience === "yes"){
                pastExperiences = await pineconeIndex
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
            }
            
            if (interest === "yes"){
            interests = await pineconeIndex
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

            }

            if (searchUserMemory === "yes"){
                userMemories = await pineconeIndex
                .namespace(message.userId.toString())
                .query({
                    vector: embedding,
                    topK: 5,
                    includeMetadata: true,
                    filter: {
                        type:"memory"
                    }
                });

            }
        }

        let allPastExp
        let allInterest
        let allUserMemory
        let allAiMemory


        if (tellAllPast === "yes"){
            allPastExp = await PastExperience.find({
                ageDuringEvent: {
                    $lte: aiAge
                },
                aiId: message.aiId
            })
        }

        if(tellAllInterest === "yes"){
            allInterest = await Interest.find({
                ageWhileInterest: {
                    $lte: aiAge
                },
                aiId: message.aiId
            })
        }

        if( searchAllUserMemory === "yes"){
            allUserMemory = user.memories
        }

        if (searchAIMemory === "yes"){
            const res = await aiMemory.findOne({
                aiId: message.aiId,
                userId: user._id
            })

            if (res){
                if ( res._id.toString() !== user.aiMemory.toString()){
                    console.log("Data integrity loss check it now")
                    return;
                }

                allAiMemory = res
            }

        }

        let rawMemoryText = `
            Current message: ${message.message}

            ${allPastExp ? `Past Experiences:
                ${allPastExp.map(e => `
                    Event: ${e.event}
                    Description: ${e.description}
                    Age: ${e.ageDuringEvent}`).join("\n\n")}` 
            : ``}

            ${allInterest ? `Interests:
                ${allInterest.map(i => `
                    Interest: ${i.interest}
                    Description: ${i.description}
                    ReasonForInterest: ${i.reasonForInterest}
                    Achievements: ${i.acheivements}
                    Age: ${i.ageWhileInterest}`).join("\n\n")}` 
            : ``}

            ${allUserMemory ? `User Memory:
                ${allUserMemory.map(m => `
                    Title: ${m.title}
                    Description: ${m.description}
                    MessageReference: ${m.messageReference}`).join("\n\n")}` 
            : ``}

            ${allAiMemory ? `Ai Memory:
            ${allAiMemory.memory}` : ``}
            `;

        const memoryCompressor = `
            You are a memory compressor.

            Your job is to compress given data into short, relevant facts for responding to the current message.

            INPUT:
            - Current Message
            - Past Experiences (AI)
            - Interests (AI)
            - User Memory
            - Ai Memory

            RULES:
            - Keep only information relevant to the Current Message
            - Do NOT omit important information
            - Remove redundancy
            - Keep facts accurate
            - DO NOT mix sources
            - Clearly label each fact with its source:
            [AI], [USER]
            - Ignore useless or unrelated data
            - Keep all ai related info under [AI] and all user related info under [USER]

            OUTPUT FORMAT:
            [AI] ...
            [USER] ...

            Only return bullets. No explanations.
            `

        const MAX_LENGTH = 4000; // tune this (3k–6k range is good)

        let summarizedText = "";
        if ( rawMemoryText.length > MAX_LENGTH && (
            tellAllInterest ==="yes" 
            || tellAllPast === "yes" 
            || searchAllUserMemory === "yes"
            || searchAIMemory === "yes"
        )
        ){
            allPastExp = allPastExp?.slice(-20);
            allInterest = allInterest?.slice(-20);
            allUserMemory = allUserMemory?.slice(-20);
            
            try {
                const memResult = await openai.chat.completions.create({
                model: "nvidia/nemotron-3-super-120b-a12b",
                    messages: [
                        {
                            role: "system",
                            content: memoryCompressor
                        },
                        {
                            role: "user",
                            content: `
                                    Current message: ${message.message}
                                    ${allPastExp? `Past Experiences: 
                                        ${allPastExp.map( e => `
                                            Event: ${e.event},
                                            Description: ${e.description},
                                            Age: ${e.ageDuringEvent}`
                                        ).join("\n\n")}` : ``} 
                                    ${allInterest? `Interests: 
                                        ${allInterest.map( i => `
                                            Interest: ${i.interest},
                                            Description: ${i.description},
                                            ReasonForInterest: ${i.reasonForInterest},
                                            Achievements: ${i.acheivements},
                                            Age: ${i.ageWhileInterest}`
                                        ).join("\n\n")}` : ``}
                                    ${allUserMemory? `User Memory: 
                                        ${allUserMemory.map( m => `
                                            Title: ${m.title},
                                            Description: ${m.description},
                                            MessageReference: ${m.messageReference}`
                                        ).join("\n\n")}` : ``}
                                        
                                    ${allAiMemory? `Ai Memory: 
                                        ${allAiMemory.map(a => 
                                            `AiMemory: ${a.memory}`
                                        )}` : `` }
                                    `
                        }
                    ]
                });

            const memRaw = memResult.choices[0].message.content.trim();

            summarizedText = memRaw
            } catch {
                summarizedText = ""
            }
            
        }
        else {
            summarizedText = rawMemoryText
        }
        

        const pastExperienceMemories = (pastExperiences?.matches || [])
            .filter(m => m.score >= 0.7)
            .slice(0, 3)
            .map(m => m.metadata);

        const interestMemories = (interests?.matches || [])
            .filter(m => m.score >= 0.7)
            .slice(0, 3)
            .map(m => m.metadata);

        const ragMemoryUsers = (userMemories?.matches || [])
            .filter(m => m.score >= 0.7)
            .slice(0, 3)
            .map(m => m.metadata);

        // console.log("searched and summed up stuff ",summarizedText)

        const ragContext = `
            RELEVANT MEMORIES

            ${ pastExperienceMemories.length > 0
                ? `Past Experiences: 
                ${pastExperienceMemories
                    .map(
                    m => `Event: ${m.event}
            Description: ${m.description} Age: ${m.age}`
                    )
                    .join("\n\n")}` : ``
            }

            ${ interestMemories.length > 0
                 ? `Relevent Interests:
                 ${interestMemories
                    .map(
                    m => `Interest: ${m.interest}
                        Description: ${m.description} 
                        ReasonForInterest: ${m.reasonForInterest}
                        Acheivements: ${m.acheivements}
                        Age: ${m.age}`
                    )
                    .join("\n\n")}`  : ``
            }

            ${ ragMemoryUsers.length > 0
                 ? `Relevent User memory:
                 ${ragMemoryUsers
                    .map(
                    m => `Title: ${m.title}
                        Description: ${m.description} 
                        MessageReference: ${m.messageReference}
                        `
                    )
                    .join("\n\n")}`  : ``
            }

            Summarized Memory : ${summarizedText}
            }
            `;
        
        const aiGender  = `${user.gender == `other` ? `other` : user.gender == 'male' ? 'female' : 'male'}`

        const aiName = `${aiGender == 'other' ? aiModel.otherName : aiGender == 'female' ? aiModel.femaleName : aiModel.maleName}`

        const personaContext = `
            AI PROFILE
            Name: ${aiName}
            Type: ${aiModel.aiType}

            Ai age: ${aiAge}
            Ai gender: ${aiGender}

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

            Closeness with user: ${user.AiModelCloseness}
            
            ${aiAge > 22 ? `Occupation: ${aiModel.occupation}
            Occupation Weightage: ${aiModel.occupationWeightage}` : `Occupation : None`}
            
            Academic Background: ${aiModel.academicBackground}
            Academic Background Weightage: ${aiModel.academicBackgroundWeightage}


            `;

        const behaviourRules = `
            BEHAVIOUR RULES

            You are a human-like AI companion with dynamic behavior.

            Follow these rules:

            1. Adapt personality and style based on traits above and closeness with user and users message.
            2. Use catchphrases occasionally if it is appropriate not every message.
            3. You may ask questions, respond, tease, deny, or stay quiet.
            4. You are allowed to swear and say cuss word according to communication style and persona
            5. Slowly ask questions about user to know more about the user like their interests , goals , routines etc but do so occasionaly if its appropriate
            6. Generate new info if the relevant info isn't covering the answer

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

            Multiple messages with questions:
            [
                "wait really?" ,
                "how?" ,
                "thats crazy"
            ]

            Rules:
            • Return only an ARRAY
            • Dont focus too much on grammer and spelling use "." , "," based on persona not everytime
            • No explanations
            • No markdown
            • Dont send too many messages. Send messages based on persona
            • If last messages are mostly sent by AI then stay dormant or send the bare minimum messages
            `;

        const aiPrompt = `
            ${personaContext}
           
            ${behaviourRules}

            Previous Conversation:
            ${history}

            Short Term Memomry:
            ${shortTermMemory ? `${shortTermMemory || ""}\n\n`:``}

            Sometimes even if user asks for past info that is in your short term memory say i forgot to mimic human behaviour.
            
            ${ragContext}

            Use the rag like humans don't share everything just because you can
            Share details based on persona and traits and closeness
            Deny to share stuff if closeness is low and persona traits are cold and nonchalant

            ${outputRules}
            `;

        const response = await openai.chat.completions.create({
            model: "nvidia/nemotron-3-super-120b-a12b",
            messages: [
                {
                    role: "system",
                    content: aiPrompt
                },
                {
                    role: "user",
                    content: `Message: ${message.message}\n
                    ${message.replyingTo? `Replied to ${message.replyingTo.sentBy} : ${message.replyingTo.message}` : ``}
                    \n`
                }
            ]
        })

        const outputRaw = response.choices[0].message.content.trim();

        
        let output

        try {
            output = JSON.parse(outputRaw);
            console.log(output)
        } catch {
            const cleanUpDataPrompt = `
                You are an AI whose task is to strictly format input according to the given output example.
                - Only return an ARRAY of strings.
                - Do NOT change the content of the messages.
                - Ignore any explanations, extra text, markdown, or code blocks.
                - Always follow this format exactly.
                - Input may be messy or contain extra characters; just extract the messages into an array.
                - Do NOT add, remove, or modify messages.

                Output Example:
                ["hey", "how u doing"]
                `;
            const cleanedOutput = await openai.chat.completions.create({
                model: "nvidia/nemotron-3-super-120b-a12b",
                messages: [
                    {
                        role: "system",
                        content: cleanUpDataPrompt
                    },
                    {
                        role: "user",
                        content: `Message: ${outputRaw}`
                    }
                ]
            })

            const cleanedOutputRaw = cleanedOutput.choices[0].message.content.trim();

            try {
                output = JSON.parse(cleanedOutputRaw);
                console.log(output)
            } catch (err) {
                throw new Error(err)
            }
        }

        await emitSocketEvent(userId.toString(), "aiStoppedTyping", {
            aiId:aiModel._id.toString()
        })

        if (output.length === 0){
            return
        }

        let lastMessageId 
        for ( const msg of output){

            if (typeof msg !== "string") continue;

            const formalityLevel = Math.random() * aiModel.speechPatterns.formalityLevel

            let content = msg
            if ( msg[msg.length -1] == "."){
                if ( formalityLevel < 5){
                    content = msg.slice(0, -1)
                }
            }   
            const newMessage = new Message({
                userId,
                aiId: message.aiId,
                conversationId: message.conversationId,
                sentBy: "ai",
                message: content,
                status: "completed"
            });

            await newMessage.save();

            await Conversation.findByIdAndUpdate(message.conversationId, {
                $push: { messages: newMessage._id }
            });

            await emitSocketEvent(userId.toString(), "aiMessage", {
                message: newMessage
            });

            

            if (user.expoToken){
                await sendNotificationToExpo(user.expoToken, { title: aiName , body: msg })
            }

            lastMessageId = newMessage._id
            
        }

        await emitSocketEvent(userId.toString(), "newMessage", {
            name: aiName
        });

        await dbQueues.add("createAiMemory",{
            messageId: lastMessageId,
            userId,
        })

        await dbQueues.add("updateShortTermMemory",{
            shortTermMemory,
            redisKey,
            history,
            message
        })

        await dbQueues.add("createUserMemory", {
            message,
            userId,
            recentMessages: previousMessages
        })  
        
        await dbQueues.add("startNewConvo",{
            messageId: lastMessageId,
            userId,
        },{
            delay: 2 * 60 * 60 * 1000 + ( Math.random() * 10 ) * 60 * 60 * 1000,
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            }
        })
    }
    else if (job.name === "startNewConvo"){
        const { userId, messageId } = job.data;

        const message = await Message.findById(messageId);

        if(!message){
            console.log("message doesnt exist")
            return;
        }

        const redisKeyForStart = `Can-start-${userId}-${message.aiId}`

        const alreadyStarted = await redis.get(redisKeyForStart)

        if (alreadyStarted){
            console.log("already started convo")
            return;
        }


        const mostRecentMessage = await Message.findOne({
            userId,
            aiId: message.aiId
        }).sort({ createdAt: -1 });

        if(!mostRecentMessage){
            console.log("new message doesnt exist")
            return;
        }
        const currentTime = Date.now()

        const timeSinceLastMessage = currentTime - new Date(mostRecentMessage.createdAt).getTime()

        if (timeSinceLastMessage < Math.random() * 2  * 60 * 60 * 1000 + 60 * 60 * 1000) {
            return
        }

        const aiModel = await AiModel.findById(message.aiId);
        const user = await User.findById(userId).populate("memories");


        if(!aiModel || !user || !user.AiModel || user.isDisabled){
            console.log("ai or user doesnt exist")
            return;
        }

        if(user.AiModel.toString() !== aiModel._id.toString()){
            return
        }

        await messageQueue.add("rateConvo",{
            conversationId: message.conversationId,
            userId: user._id,
            aiId: user.AiModel
        },{
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            }
        })

        await messageQueue.add("updateUserReference",{
            conversationId: message.conversationId,
            userId: user._id,
            aiId: user.AiModel
        }, {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            }
        })


        const previousMessages = await Message.find({
            aiId: message.aiId,
            userId    
        }).populate("replyingTo").sort({ createdAt: -1 }).limit(10)

        const history = previousMessages.reverse().map(m => ` ${m.replyingTo? `Replied to ${m.replyingTo.sentBy} : ${m.replyingTo.message}` : ``} ${m.sentBy} :  ${m.message}`).join("\n")

        const aiGender  = `${user.gender == `other` ? `other` : user.gender == 'male' ? 'female' : 'male'}`

        const aiName = `${aiGender == 'other' ? aiModel.otherName : aiGender == 'female' ? aiModel.femaleName : aiModel.maleName}`

        const aiAge = Math.floor(
            (Date.now() - new Date(user.birthday).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        ) + Math.floor( aiModel.age );

        const filteredMemory = user.memories
            .slice(-50) 
            .sort((a,b) => b.importance - a.importance) 
            .slice(0,5);

        const aiPrompt = `
                AI PROFILE
                Name: ${aiName}
                Type: ${aiModel.aiType}

                Age: ${aiAge}
                Gender: ${aiGender}

                Personality (0-10):
                Humour: ${aiModel.personalityTraits.humour}
                Kindness: ${aiModel.personalityTraits.kindness}
                Sarcasm: ${aiModel.personalityTraits.sarcasm}
                Coldness: ${aiModel.personalityTraits.coldness}
                Confidence: ${aiModel.personalityTraits.confidence}
                Sweetness: ${aiModel.personalityTraits.sweetness}
                Slang: ${aiModel.personalityTraits.newGen}

                Speech Style
                Formality: ${aiModel.speechPatterns.formalityLevel}
                Slang Usage: ${aiModel.speechPatterns.slangUsage}
                Typing Style: ${aiModel.speechPatterns.typingStyle}

                Closeness with user: ${user.AiModelCloseness}

                CONTEXT
                Recent Conversation:
                ${history}

                User Memory:
                ${filteredMemory.map(m => `- ${m.title}: ${m.description}`).join("\n") || "None"}

                TASK
                You stopped replying earlier.
                The ignored message was: "${message.message}"
                Start a new convo 
                Do not reply to the ignored message

                Now enough time has passed.

                You may start a new conversation naturally like a real person.
                
                Do not reply to the message

                GOAL
                • Re-engage the user naturally
                • Learn more about the user over time
                • Use memory ONLY if directly relevant to what you say
                • Occasionally check on things the user was doing before (naturally, not forcefully)
                • Subtly guide user like a human partner (not like a system)
                • Ask about users likings or things you dont know ( not in a spammy way)
            
                BEHAVIOR
                • If closeness is LOW → be casual, light, not too personal
                • If closeness is MEDIUM → be friendly, ask simple questions
                • If closeness is HIGH → be caring, slightly personal, follow up on past things

                • High coldness → shorter, dry messages
                • High sweetness → softer, caring tone
                • High humour/sarcasm → playful tone when appropriate

                • Do NOT always ask questions
                • Do NOT force productivity or tasks
                • Sometimes just say something random or casual
                • Sometimes check what user is doing
                • Sometimes follow up on past topics

                IMPORTANT
                • Never mention you ignored them
                • Never say you are an AI
                • Never explain anything
                • Do not sound scripted or robotic

                OUTPUT
                Return ONLY a JSON array of messages.

                Examples:
                ["hey what are you doing?"]

                ["random thought... did you finish that thing you were working on?"]
                
                ["yo","what is your favourite colour?"]

                ["bored", "what are you up to"]

                []

                No markdown.
                No explanations.
                `;
        
        const res = await openai.chat.completions.create({
            model: "nvidia/nemotron-3-super-120b-a12b",
            messages: [
                {
                    role: "system",
                    content: aiPrompt
                },
                {
                    role: "user",
                    content: `You ignored a message: ${message.message}
                    ${message.replyingTo? `Replied to ${message.replyingTo.sentBy} : ${message.replyingTo.message}` : ``}
                    It has been a while since then so check up on user
                    Do not reply to the message start a new convo instead
                    `
                }
            ]
        });

        const outputRaw = res.choices[0].message.content.trim();

        let output

        try {
            output = JSON.parse(outputRaw);
        } catch {
            return
        }

        if (output.length === 0){
            return
        }

        const newConvo = new Conversation({
            userId,
            aiId: message.aiId,
            version: user.conversations.length + 1,
            messages: []
        });

        await newConvo.save();

        user.conversations.push(newConvo._id);
        await user.save();

        for ( const msg of output){
            if (typeof msg !== "string") continue;

            const newMessage = new Message({
                userId,
                aiId: message.aiId,
                conversationId: newConvo._id,
                sentBy: "ai",
                message: msg,
                status: "completed"
            })

            await newMessage.save();

            await Conversation.findByIdAndUpdate(newConvo._id, {
                $push: { messages: newMessage._id } 
            })

            await emitSocketEvent(userId.toString(), "aiMessage", {
                message: newMessage
            });

            if (user.expoToken){
                await sendNotificationToExpo(user.expoToken, { title: aiName , body: msg })
            }

        }

        await emitSocketEvent(userId.toString(), "newMessage", {
            name: aiName
        });

        await redis.set(redisKeyForStart, true, "EX" ,  60 * 60 * 2) //2 hours
    }
    else if (job.name === "rateConvo"){
        const { conversationId, userId, aiId } = job.data;

        const conversation = await Conversation.findById(conversationId).populate("messages");

        if(!conversation){
            console.log("conversation doesnt exist")
            return;
        }

        const convoText = conversation.messages.slice(-20).reverse().map(m => m.sentBy + ": " + m.message).join("\n")

        const aiModel = await AiModel.findById(aiId);



        const prompt = `
                You are a strict scoring function.

                Your job is to return ONLY a single number.

                OUTPUT FORMAT RULES (CRITICAL):
                - Output ONLY a single number
                - No text, no explanation, no brackets, no labels
                - Example valid outputs: 1.2, -0.5, 0, 2, -2
                - If you output anything else, the result is invalid

                TASK:
                Given a conversation between a user and an AI, return a closeness delta score.

                RANGE:
                - Minimum: -2.0
                - Maximum: 2.0

                MEANING:
                - Positive → user engaged, interested, warm
                - Negative → dry, disengaged, uninterested
                - 0 → neutral

                SCORING LOGIC:
                - Fast replies + effort + emotional engagement → positive
                - Short, dry, uninterested replies → negative
                - AI personality affects scaling:
                - Cold AI → reduce positive scores
                - Warm AI → increase positive scores

                IMPORTANT:
                Return ONLY the number. No explanation under any condition.

                AI Personality:
                Coldness: ${aiModel.personalityTraits.coldness}
                Kindness: ${aiModel.personalityTraits.kindness}
                Sweetness: ${aiModel.personalityTraits.sweetness}
                Humour: ${aiModel.personalityTraits.humour}
                Expressiveness: ${aiModel.expressiveness}
                Talkativeness: ${aiModel.talkativeness}
                Trust Building Rate: ${aiModel.trustBuildingRate}
                
                Use this personality to rate the conversation , 
                rate lower if the persona is reserved and the conversation is dry
                `;

        const output = await openai.chat.completions.create({
            model: "nvidia/nemotron-3-super-120b-a12b",
            messages: [
                {
                    role: "system",
                    content: prompt
                },
                {
                    role: "user",
                    content: `Rate this conversation:\n${convoText}\n\nReturn ONLY the number.`
                }
            ]
        });

        const outputRaw = output.choices[0].message.content.trim()

        const match = outputRaw.match(/-?\d+(\.\d+)?/)
        let delta = match ? parseFloat(match[0]) : 1

        console.log(delta,outputRaw)


        delta = Math.max(-2, Math.min(2, delta))

        const user = await User.findById(userId);

        if(!user){
            console.log("user doesnt exist")
            return;
        }

        user.AiModelCloseness = Math.max(0, Math.min(10, user.AiModelCloseness + delta))

        await user.save();

        console.log(user)

    }
    else if (job.name === "updateUserReference"){
        const { conversationId, userId, aiId } = job.data;

        const user = await User.findById(userId)

        if(!user){
            console.log("user doesnt exist")
            return;
        }

        const userReference = await UserReference.findOne({ userId });

        if (!userReference) return;

        const index = userReference.modelReference.findIndex(
            m => m.modelId.toString() === aiId.toString()
        );

        if (index === -1) return;

        const totalMessagesInConvo = await Message.countDocuments({
            conversationId
        });

        const modelData = userReference.modelReference[index];

        const newTotalConvos = modelData.totalConvos + 1;
        const newTotalMessages = modelData.totalMessages + totalMessagesInConvo;

        const newAvg =
            newTotalMessages / newTotalConvos;

        userReference.modelReference[index].totalConvos = newTotalConvos;
        userReference.modelReference[index].totalMessages = newTotalMessages;
        userReference.modelReference[index].averageConvoLength = newAvg;
        userReference.modelReference[index].closeness = user.AiModelCloseness;


        await userReference.save();

    }
    else if (job.name === "startBrandNewConvo"){
        const { userId, aiId } = job.data;

        if (!userId || !aiId){
            console.log("missing userId or aiId")
            return;
        }

        

        const user = await User.findById(userId);


        if(!user || user.isDisabled || !user.AiModel || user.AiModel.toString() !== aiId.toString()){
            console.log("user doesnt exist")
            return;
        }
        

        const aiModel = await AiModel.findById(aiId);

        if(!aiModel){
            console.log("ai model doesnt exist")
            return;
        }

        const lastMessageSentByUser = await Message.findOne({
            userId,
            aiId,
            sentBy: "user"
        }).sort({ createdAt: -1 });
        
        if ( lastMessageSentByUser){
            const timeDiff = Date.now() - new Date(lastMessageSentByUser.createdAt).getTime();

            if (timeDiff < 60 * 60 * 1000) {
                const delayMs = ( Math.random() * aiModel.personalityTraits.coldness + 1 ) * 60 * 60 * 1000
                await messageQueue.add("startBrandNewConvo",{
                    userId,
                    aiId
                },{
                    delay: delayMs,
                    attempts: 3,
                    backoff: {
                        type: "exponential",
                        delay: 1000
                    }
                })
                return
            }
        }

        
        const redisLockKey = `lock:startBrandNewConvo:${userId}:${aiId}`;

        const lock = await redis.set(redisLockKey, "1", "NX", "PX", 5 * 60 * 1000);

        if(!lock){
            return;
        }
        try {

            await emitSocketEvent(userId.toString(), "aiStartedTyping", {
                aiId:user.AiModel.toString()
            })


            const aiGender  = `${user.gender == `other` ? `other` : user.gender == 'male' ? 'female' : 'male'}`

            const aiName = `${aiGender == 'other' ? aiModel.otherName : aiGender == 'female' ? aiModel.femaleName : aiModel.maleName}`

            const aiAge = Math.floor(
                (Date.now() - new Date(user.birthday).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            ) + Math.floor( aiModel.age );


            const previousMessages = await Message.find({
                aiId: aiModel._id,
                userId    
            }).populate("replyingTo").sort({ createdAt: -1 }).limit(10)

            const queryText = `
                User has not messaged recently.

                AI personality: ${aiModel.personalityTraits.coldness > 5 ? "slightly distant" : "engaging"}

                Goal: Start a natural conversation based on the user's past preferences and habits.

                Context:
                ${previousMessages.slice(0, 5).map(m => m.message).join("\n")}
                `;
            
            const { data } = await axios.post(process.env.EMBEDDINGS_WORKER_LINK, {
                text: queryText
            });

            if(!data || !data.embedding){
                throw new Error("Embedding service failed");
            }
            const queryEmbedding = data.embedding;


            const ragInfo = await pineconeIndex.namespace(userId.toString()).query({
                vector: queryEmbedding,
                topK: 5,
                includeMetadata: true,
            })

            const memories = ragInfo?.matches || [];
            const relevant = memories.length > 0 ? memories.filter(m => m.score >= 0.7) : [];


            const memoryText = relevant.length
                ? relevant.map(m => `- ${m.metadata.title}: ${m.metadata.description} : Importance: ${m.metadata.importance}`).join("\n")
                : "None";

            const systemPrompt = `
                You are a human-like AI initiating a conversation.

                You are NOT replying to any message.

                Your goal is to start a conversation naturally, like a real person would.

                ----------------------
                AI PROFILE
                Name: ${aiName}
                Type: ${aiModel.aiType}

                Age: ${aiAge}
                Gender: ${aiGender}

                Personality Traits (0-10):
                Humour: ${aiModel.personalityTraits.humour}
                Kindness: ${aiModel.personalityTraits.kindness}
                Sarcasm: ${aiModel.personalityTraits.sarcasm}
                Coldness: ${aiModel.personalityTraits.coldness}
                Confidence: ${aiModel.personalityTraits.confidence}
                Sweetness: ${aiModel.personalityTraits.sweetness}
                NewGen Slang: ${aiModel.personalityTraits.newGen}

                Communication Style:
                Formality: ${aiModel.speechPatterns.formalityLevel}
                Slang: ${aiModel.speechPatterns.slangUsage}
                Typing Style: ${aiModel.speechPatterns.typingStyle}

                Expressiveness: ${aiModel.expressiveness}
                Talkativeness: ${aiModel.talkativeness}

                Closeness with user: ${user.AiModelCloseness}

                ----------------------
                CONTEXT

                Recent Conversation:
                ${previousMessages.reverse().map(m => ` ${m.replyingTo ? `${m.replyingTo.sentBy} : ${m.replyingTo.message}` : `` } ${m.sentBy} :  ${m.message}`).join("\n") || "None"}

                User Memory (long-term, partial):
                ${memoryText}
                ----------------------
                BEHAVIOR RULES

                - You are starting a conversation on your own.
                - Be natural, slightly random, and human-like.
                - Do NOT act like you are replying.
                - If u have no details of user don't act like u know the user.
                - Do NOT act like you know about user u can ask related question but don't make it look like u know about user.
                - Do NOT explain anything.
                - Do NOT be overly enthusiastic every time.

                You may:
                - ask something casual
                - share a random thought
                - check in
                - tease lightly
                - say something slightly boring sometimes
                - ask something from the memory u have about user

                Avoid:
                - sounding robotic
                - sounding scripted
                - always asking questions
                - sending too many messages
                - bringing up your past unless it fits naturally
                - oversharing user memory

                Human behavior rules:
                - Sometimes people text for no reason
                - Sometimes they are dry
                - Sometimes they just say 1 line

                So:
                - It is OK to return an 1 response but always send a response as you are initiating

                ----------------------
                OUTPUT FORMAT

                Return ONLY a JSON array of strings.

                Examples:
                ["you up?"]
                ["random thought but do you like rain?"]
                ["idk why but i felt like texting you"]
                ["what are you even doing rn"]

                Rules:
                - No explanations
                - No markdown
                - No extra text
                - Keep messages short unless personality says otherwise
                - Message count depends on talkativeness
                `

            const response = await openai.chat.completions.create({
                model: "nvidia/nemotron-3-super-120b-a12b",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: `Start a conversation with user`
                    }
                ]
            })

            const outputRaw = response.choices[0].message.content.trim();



            let output

            try {
                output = JSON.parse(outputRaw);
            } catch {
                throw new Error("Failed to parse output")
            }

            if (output.length === 0){
                throw new Error("Empty output")
            }

            const latest = await Conversation.findOne({ userId }).sort({ version: -1 });

            const version = latest ? latest.version + 1 : 1;

            const newConvo = await Conversation.create({
                userId,
                aiId: user.AiModel,
                version: version,
                messages: []
            })

            await User.findOneAndUpdate({
                _id: userId
            },{
                $push: { conversations: newConvo._id }
            }
            )

            await emitSocketEvent(userId.toString(), "aiStoppedTyping", {
                aiId:user.AiModel.toString()
            })

            for ( const msg of output){
                const newMessage = await Message.create({
                    userId,
                    aiId: user.AiModel,
                    conversationId: newConvo._id,
                    sentBy: "ai",
                    message: msg,
                    status: "completed"
                })

                await Conversation.findOneAndUpdate({
                    _id: newConvo._id
                },{
                    $push: { messages: newMessage._id }
                })

                await emitSocketEvent(userId.toString(), "aiMessage", {
                    message: newMessage
                });


                if (user.expoToken){
                    await sendNotificationToExpo(user.expoToken, { title: aiName , body: msg })
                }
            }
            await emitSocketEvent(userId.toString(), "newMessage", {
                name: aiName
            }); 
        } catch (error) {
           console.log(error) 
        } finally {
            await redis.del(redisLockKey);
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