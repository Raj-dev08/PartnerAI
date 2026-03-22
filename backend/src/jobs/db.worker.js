import { Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import { connectDB } from "../lib/db.js";

import Interest from "../model/interest.model.js";
import PastExperience from "../model/past.model.js"
import AiModel from "../model/ai.model.js";
import User from "../model/user.model.js";
import Memory from "../model/memory.model.js";
import { pineconeIndex } from "../lib/pinecone.js";
import axios from "axios";
import OpenAI from "openai";


await connectDB();

const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_URL
});

const dbWorker = new Worker("db-queue", async (job) => {

    let interestDoc = null;
    let pastExperienceDoc = null;
    let memoryDoc = null;

    try {
        if ( job.name === "createInterest" ) {
            const { aiId , interest , description , reasonForInterest , age , acheivements } = job.data;

            interestDoc = await Interest.create({
                aiId,
                interest,
                description,
                reasonForInterest,
                ageWhileInterest: age,
                acheivements
            })

            await AiModel.findByIdAndUpdate(aiId, {
                $push: {
                    interests: interestDoc._id
                }
            })
            
            const text = `
            Interest: ${interest}
            Description: ${description}
            `

            const { data } = await axios.post(process.env.EMBEDDINGS_WORKER_LINK,{
                text
            })

            if (!data || !data.embedding) {
                throw new Error("Embedding service returned invalid response");
            }

            const embedding = data.embedding;

            await pineconeIndex.namespace(aiId.toString()).upsert([
                {
                    id: `int-${aiId}-${interest}`,
                    values: embedding,
                    metadata: {
                        type: "interest",
                        age,
                        interest,
                        description,
                        reasonForInterest,
                        acheivements: acheivements || [],
                    },
                },
            ]);
        }

        else if ( job.name === "createPastExperience" ){
            const { aiId , event , description , age } = job.data;

            pastExperienceDoc = await PastExperience.create({
                aiId,
                event,
                description,
                ageDuringEvent: age,
            })

            await AiModel.findByIdAndUpdate(aiId, {
                $push: {
                    pastExperiences: pastExperienceDoc._id
                }
            })

            const text = `
                Event: ${event}
                Description: ${description}
            `
            const { data } = await axios.post(process.env.EMBEDDINGS_WORKER_LINK,{
                text
            })

            if (!data || !data.embedding) {
                throw new Error("Embedding service returned invalid response");
            }

            const embedding = data.embedding;

            await pineconeIndex.namespace(aiId.toString()).upsert([
                {
                    id: `exp-${aiId}-${event}`,
                    values: embedding,
                    metadata: {
                        type: "experience",       
                        age,
                        event,
                        description,
                    },
                },
            ]);
        }
        else if ( job.name === "createUserMemory" ){
            const { message , userId , recentMessages } = job.data;

            const user = await User.findById(userId);

            if (!user || !user.AiModel || user.isDisabled){
                return;
            }

            const systempPrompt = `You are a Long-Term Memory Extraction Engine.

                                    Your job is to determine if the user's message contains meaningful information that should be stored as a long-term memory.

                                    INPUTS YOU RECEIVE
                                    1. Recent conversation
                                    2. The latest user message

                                    Your task:
                                    • Decide if the message contains meaningful information worth remembering.
                                    • If it does, extract a concise memory.
                                    • Prioritize the user message more and only take the needed context from previous conversations
                                    • Do not save the previous conversations that is out of context with the current message

                                    Do NOT store memories for trivial messages 

                                    MEMORY FORMAT RULES
                                    • Title: short phrase summarizing the memory
                                    • Description: 1–2 concise sentences explaining the memory
                                    • Importance: number describing how important the memory is , the range is 0-10
                                    • Description should be clear and context independent
                                    • Do not invent information
                                    • Use time if the message mentions it
                                    • Make sure the title and description combined should be less than 60 words

                                    OUTPUT RULES
                                    Return ONLY valid JSON.
                                    No explanations.
                                    No markdown.
                                    No extra text.

                                    If the message is NOT worth remembering return:

                                    {
                                    "store": "no"
                                    }

                                    If the message IS worth remembering return:

                                    {
                                    "store": "yes",
                                    "title": "short memory title",
                                    "description": "clear description of the memory",
                                    "importance": 5 
                                    }
                                    `

            const respones = await openai.chat.completions.create({
                model: "meta/llama3-70b-instruct",
                messages: [
                    {
                        role: "system",
                        content: systempPrompt
                    },
                    {
                        role: "user",
                        content: `
                        Current Message: ${message.message}
                        ${message.replyingTo? `Replied to ${message.replyingTo.sentBy} : ${message.replyingTo.message}` : ``}
                        Previous Messages: ${recentMessages}
                        
                        `
                    }
                ]
            });

            const output = respones.choices[0].message.content;
            const msg = `${message.message}
                        ${message.replyingTo? `Replied to ${message.replyingTo.sentBy} : ${message.replyingTo.message}` : ``}`

            try {
                let res;

                if(output.startsWith("```json")){
                    res = JSON.parse(output.replace(/```json|```/g, '').trim());
                } else{
                    res = JSON.parse(output)
                }


                if (res.store === "yes"){
                    memoryDoc = await Memory.create({
                        userId,
                        title: res.title,
                        description: res.description,
                        importance: res.importance,
                        messageReference: msg
                    })



                    const deleteMemomries = await Memory.find({
                            userId
                        }).sort({ importance: 1 , createdAt: 1})

                    if(deleteMemomries.length  > 120){
                        const toDelete = deleteMemomries.slice(0, deleteMemomries.length - 100);

                        await Memory.deleteMany({ _id: { $in: toDelete.map(mem => mem._id) } });

                        await User.updateOne(
                            { _id : userId } , {
                            $pull: { memories: { $in: toDelete.map(mem => mem._id) } }
                        });

                        await pineconeIndex.namespace(userId.toString()).deleteMany({
                            ids: toDelete.map(mem => `memory-${userId}-${mem._id}`)
                        });
                    }
                    

                    await User.updateOne({
                        _id: userId
                    }, {
                        $addToSet: {
                            memories: memoryDoc._id
                        }
                    })

                    
                    
                    const text = `
                        Title: ${res.title}
                        Description: ${res.description}
                    `
                    const { data } = await axios.post(process.env.EMBEDDINGS_WORKER_LINK,{
                        text
                    })

                    if (!data || !data.embedding) {
                        throw new Error("Embedding service returned invalid response");
                    }

                    const embedding = data.embedding;

                    await pineconeIndex.namespace(userId.toString()).upsert([
                        {
                            id: `memory-${userId}-${message._id}`,
                            values: embedding,
                            metadata: {
                                type: "memory",       
                                title: res.title,
                                description: res.description,
                                importance: res.importance,
                                messageReference: msg
                            },
                        },
                    ]);

                    
                } else {
                    return;
                }
            } catch (error) {
                return;
            }

        }

        else if ( job.name === "generateEmbeddingsForAiModel"){
            const { aiId } = job.data;

            const aiModel = await AiModel.findById(aiId);

            if (!aiModel){
                return;
            }

           const text = `
                A ${aiModel.aiType} AI that is 
                ${aiModel.personalityTraits.humour > 7 ? 'very humorous' : aiModel.personalityTraits.humour > 4 ? 'somewhat humorous' : 'serious'}, 
                ${aiModel.personalityTraits.sarcasm > 6 ? 'sarcastic' : 'polite'}, 
                and ${aiModel.personalityTraits.confidence > 6 ? 'confident' : 'a bit timid'}.

                It is ${aiModel.personalityTraits.kindness > 6 ? 'kind' : 'neutral'} 
                and ${aiModel.personalityTraits.coldness > 6 ? 'emotionally distant' : 'warm'}.

                Communication is ${aiModel.speechPatterns.typingStyle}, 
                ${aiModel.speechPatterns.formalityLevel > 5 ? "formal" : "casual"}, 
                with ${aiModel.speechPatterns.slangUsage > 5 ? "modern slang" : "minimal slang"}.

                The AI is ${aiModel.expressiveness > 6 ? "expressive" : "reserved"} 
                and ${aiModel.talkativeness > 6 ? "talkative" : "concise"}.
                `;

            const { data } = await axios.post(process.env.EMBEDDINGS_WORKER_LINK,{
                text
            })

            console.log(data)
            

            const embedding = data.embedding;

            if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
                throw new Error("Invalid embedding: empty or missing");
            }

            await pineconeIndex.namespace('AiModelVectors').upsert([
                {
                    id: `${aiId}`,
                    values: embedding,
                    metadata: {
                        verified: aiModel.isVerified
                    }
                },
            ]);

            
        }
            
    } catch (error) {
        console.error(error);
        
        if(interestDoc) {
            await Interest.findByIdAndDelete(interestDoc._id);
            await AiModel.findByIdAndUpdate(interestDoc.aiId, {
                $pull: {
                    interests: interestDoc._id
                }
            })
        }

        if(pastExperienceDoc) {
            await PastExperience.findByIdAndDelete(pastExperienceDoc._id);
            await AiModel.findByIdAndUpdate(pastExperienceDoc.aiId, {
                $pull: {
                    pastExperiences: pastExperienceDoc._id
                }
            })
        }

        if(memoryDoc) {
            await Memory.findByIdAndDelete(memoryDoc._id);
            await User.findByIdAndUpdate(memoryDoc.userId, {
                $pull: {
                    memories: memoryDoc._id
                }
            })          
        }
        throw error;
    } 
},{
    concurrency: 5,
    connection: redis
})

dbWorker.on("completed", (job) => {
  console.log(`Job ${job.name} completed`);
});

dbWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.name} failed:` ,err);
});