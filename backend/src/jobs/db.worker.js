import { Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import { connectDB } from "../lib/db.js";

import Interest from "../model/interest.model.js";
import PastExperience from "../model/past.model.js"
import AiModel from "../model/ai.model.js";
import { pineconeIndex } from "../lib/pinecone.js";
import axios from "axios";


await connectDB();


const dbWorker = new Worker("db-queue", async (job) => {

    let interestDoc = null;
    let pastExperienceDoc = null;

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
                    id: `int-${interestDoc._id}`,
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
                    id: `exp-${pastExperienceDoc._id}`,
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

        throw error;
    } 
},{
    connection: redis
})

dbWorker.on("completed", (job) => {
  console.log(`Job ${job.name} completed`);
});

dbWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.name} failed:` ,err);
});