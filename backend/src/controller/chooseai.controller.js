import AiModel from "../model/ai.model.js";
import UserReference from "../model/userReference.model.js";
import { pineconeIndex } from "../lib/pinecone.js";
import axios from "axios";
import { redis } from "../lib/redis.js";
import { messageQueue } from "../lib/message.queue.js";

export const firstAIModel = async(req,res,next) => {
    try {
        const { user } = req;

        if ( user.isDisabled ){
            return res.status(400).json({ message: "User is disabled" });   
        }

        if ( user.AiModel ){
            return res.status(400).json({ message: "User already has an AI model" });
        }

        const totalAICount = await AiModel.countDocuments({ isVerified: true});

        if( totalAICount === 0 ){
            return res.status(400).json({ message: "No verified AI models found" });
        }
        const randomIndex = Math.floor(Math.random() * totalAICount);

        const aiModel = await AiModel.findOne({ isVerified: true }).skip(randomIndex);

        if (!aiModel) {
            return res.status(404).json({ message: "No verified AI models found" });
        }

        if (!aiModel.eligibleRater.includes(user._id)){
            aiModel.eligibleRater.push(user._id);
            await aiModel.save();
        }

        user.AiModel = aiModel._id;
        await user.save();

        await UserReference.updateOne(
            {
                _id: user.userReference,
                "modelReference.modelId": { $ne: aiModel._id }
            },
            {
                $push: {
                modelReference: { modelId: aiModel._id }
                }
            }
        );



        await messageQueue.add("startBrandNewConvo", {
            userId: user._id // will fetch ai details so it is for user not just for ai
        },{
            delay: 1000, // 1s delay for first message then it will be random and dynamic
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            }
        })

        return res.status(200).json({
            message: "AI model assigned successfully",
            aiModel
        });
    } catch (error) {
        next(error)
    }
}

export const switchAIModel = async(req,res,next) => {
    try {
        const { user } = req;

        if ( user.isDisabled ){
            return res.status(400).json({ message: "User is disabled" });        
        }

        if (!user.AiModel ){
            return res.status(400).json({ message: "User does not have an AI model" });
        }
        
        const totalAICount = await AiModel.countDocuments({ _id: { $ne: user.AiModel }})

        if( totalAICount === 0 ){
            return res.status(400).json({ message: "No new AI models found" });
        }
        const random = Math.floor(Math.random() * totalAICount)

        const aiModel = await AiModel.findOne({ _id: { $ne: user.AiModel } }).skip(random)

        if (!aiModel){
            return res.status(404).json({ message: "No New AI models found" });
        }

        if (!aiModel.eligibleRater.includes(user._id)){
            aiModel.eligibleRater.push(user._id);
            await aiModel.save();
        }
        

        user.AiModel = aiModel._id;
        user.AiModelCloseness = 0;
        await user.save();

        return res.status(200).json({
            message: "AI model switched successfully",
            aiModel
        });
    } catch (error) {
        next(error)
    }
}

export const getAIModel = async(req,res,next) => {
    try {
        const { user } = req

        if( user.isDisabled ){
            return res.status(400).json({ message: "User is disabled" });
        }

        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        

        const searchConditions = {
            $or: [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ]
        };



        const aiModels = await AiModel.find(searchConditions)
            .populate("madeBy", "name email")
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ totalRated: -1, ratings: -1});

        const total = await AiModel.countDocuments(searchConditions);

        return res.status(200).json({
            message: "AI models fetched successfully",
            aiModels,
            total
        });
    } catch (error) {
        next(error)
    }
}

export const setAIModel = async(req,res,next) => {
    try {
        const { user } = req
        const { id } = req.params

        if ( user.isDisabled ){
            return res.status(400).json({ message: "User is disabled" });
        }

        if(!id){
            return res.status(400).json({ message: "AI model id is required" });
        }

        const aiModel = await AiModel.findById(id)

        if(!aiModel){
            return res.status(404).json({ message: "AI model not found" });
        }

        if (!aiModel.eligibleRater.includes(user._id)){
            aiModel.eligibleRater.push(user._id);
            await aiModel.save();
        }

        user.AiModel = aiModel._id;
        await user.save();

        return res.status(200).json({
            message: "AI model set successfully",
            aiModel
        });
    } catch (error) {
        next(error)
    }
}

export const getMyAIModel = async(req,res,next) => {
    try {
        const { user } = req

        if ( user.isDisabled){
            return res.status(400).json({ message: "User is disabled" });
        }

        if(!user.AiModel){
            return res.status(404).json({ message: "User does not have an AI model" });
        }

        const aiModel = await AiModel.findById(user.AiModel)
            .populate("madeBy", "name email")

        if (!aiModel){
            return res.status(404).json({ message: "AI model not found" });
        }

        return  res.status(200).json({
            message: "AI model fetched successfully",
            aiModel
        });
    } catch (error) {
        next(error)
    }
}

export const rateAIModel = async(req,res,next) => {
    try {
        const { user } = req
        const { id } = req.params
        const { rating } = req.body

        if (user.isDisabled){
            return res.status(400).json({ message: "User is disabled" });
        }

        if (!id || rating === undefined){
            return res.status(400).json({ message: "AI model id and rating are required" });
        }

        if ( isNaN(rating) || rating < 0 || rating > 5 ){
            return res.status(400).json({ message: "Invalid rating" });
        }
        
        const aiModel = await AiModel.findById(id)

        if (!aiModel){
            return res.status(404).json({ message: "AI model not found" });
        }

        if (!aiModel.eligibleRater.includes(user._id)){
            return res.status(400).json({ message: "User is not eligible to rate this AI model" });
        }

        if( aiModel.totalRaters.includes(user._id)){
            return res.status(400).json({ message: "User has already rated this AI model" });
        }

        aiModel.ratings = ( aiModel.ratings * aiModel.totalRated + rating ) / (aiModel.totalRated+1);
        aiModel.totalRated+=1;
        aiModel.totalRaters.push(user._id);
        await aiModel.save();

        await UserReference.updateOne(
            {
                _id: user.userReference,
                "modelReference.modelId": aiModel._id
            },
            {
                $set: {
                    "modelReference.$.ratings": rating
                }
            }
        )

        return res.status(200).json({
            message: "AI model rated successfully",
            aiModel
        });
    } catch (error) {
        next(error)
    }
}

export const reccomendedAIModel = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(400).json({ message: "User is disabled" });
        }

        const limit = parseInt(req.query.limit) || 10;
        const skip = parseInt(req.query.skip) || 0;

        const userRef = await UserReference.findOne({ userId: user._id });

        let queryText = null;

        if (userRef && userRef.modelReference.length > 0) {

            const strongModels = userRef.modelReference.filter(m => (
                m.ratings >= 3 &&
                m.closeness >= 5 &&
                m.totalMessages >= 100 &&
                m.averageConvoLength >= 20
            ));

            if (strongModels.length > 0) {

                const topModels = strongModels
                    .sort((a, b) => (b.ratings + b.closeness) - (a.ratings + a.closeness))
                    .slice(0, 3);

                const aiModels = await AiModel.find({
                    _id: { $in: topModels.map(m => m.modelId) }
                });

                const personalityTraits = {
                    humour: 0,
                    sarcasm: 0,
                    confidence: 0,
                    kindness: 0,
                    coldness: 0,
                    formalityLevel: 0,
                    slangUsage: 0,
                    expressiveness: 0,
                    talkativeness: 0,
                };

                let totalWeight = 0;

                topModels.forEach(ref => {
                    const model = aiModels.find(
                        m => m._id.toString() === ref.modelId.toString()
                    );
                    if (!model) return;

                    const weight = ref.ratings * 2 + ref.closeness;

                    personalityTraits.humour += model.personalityTraits.humour * weight;
                    personalityTraits.sarcasm += model.personalityTraits.sarcasm * weight;
                    personalityTraits.confidence += model.personalityTraits.confidence * weight;
                    personalityTraits.kindness += model.personalityTraits.kindness * weight;
                    personalityTraits.coldness += model.personalityTraits.coldness * weight;
                    personalityTraits.formalityLevel += model.speechPatterns.formalityLevel * weight;
                    personalityTraits.slangUsage += model.speechPatterns.slangUsage * weight;
                    personalityTraits.expressiveness += model.expressiveness * weight;
                    personalityTraits.talkativeness += model.talkativeness * weight;

                    totalWeight += weight;
                });

                Object.keys(personalityTraits).forEach(k => {
                    personalityTraits[k] /= totalWeight;
                });


                queryText = `
                    A ${aiModels[0].aiType || "conversational"} AI that is 
                    ${personalityTraits.humour > 7 ? 'very humorous' : personalityTraits.humour > 4 ? 'somewhat humorous' : 'serious'}, 
                    ${personalityTraits.sarcasm > 6 ? 'sarcastic' : 'polite'}, 
                    and ${personalityTraits.confidence > 6 ? 'confident' : 'a bit timid'}.

                    It is ${personalityTraits.kindness > 6 ? 'kind' : 'neutral'} 
                    and ${personalityTraits.coldness > 6 ? 'emotionally distant' : 'warm'}.

                    Communication is ${aiModels[0].speechPatterns.typingStyle || "normal"}, 
                    ${personalityTraits.formalityLevel > 5 ? "formal" : "casual"}, 
                    with ${personalityTraits.slangUsage > 5 ? "modern slang" : "minimal slang"}.

                    The AI is ${personalityTraits.expressiveness > 6 ? "expressive" : "reserved"} 
                    and ${personalityTraits.talkativeness > 6 ? "talkative" : "concise"}.
                    `;
            }
        }

        if (!queryText) {
            queryText = "A friendly, engaging, conversational AI with balanced personality.";
        }


        let pineconeResults;

        const cached = await redis.get(queryText);

        if (cached) {
            pineconeResults = JSON.parse(cached);
        } else {
            
            const { data } = await axios.post(process.env.EMBEDDINGS_WORKER_LINK, {
                text: queryText
            });

            if (!data || !data.embedding) {
                return res.status(500).json({ message: "Embedding service failed" });
            }

            const embedding = data.embedding;

            pineconeResults = await pineconeIndex
                .namespace("AiModelVectors")
                .query({
                    vector: embedding,
                    topK: skip + limit + 50, 
                });

            await redis.set(queryText, JSON.stringify(pineconeResults), "EX", 60 * 60 * 24);
        }

       
        const ids = pineconeResults.matches.map(m => m.id);

        const usedIds = new Set(
            userRef?.modelReference.map(r => r.modelId.toString()) || []
        );

        const filteredIds = ids.filter(id => !usedIds.has(id));

        const paginatedIds = filteredIds.slice(skip, skip + limit);

      
        let models = await AiModel.find({
            _id: { $in: paginatedIds }
        });

        models.sort((a, b) => {
            if (a.isVerified !== b.isVerified) {
                return b.isVerified - a.isVerified;
            }
            if (a.ratings !== b.ratings) {
                return b.ratings - a.ratings;
            }
            return b.totalRated - a.totalRated;
        });

        return res.status(200).json({ models });
    } catch (error) {
        next(error);
    }
};