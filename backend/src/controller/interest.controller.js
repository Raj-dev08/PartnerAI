import AiModel from "../model/ai.model.js";

import { dbQueues } from "../lib/db.queue.js";


export const createInterest = async (req, res, next) => {
    try {
        const { user } = req;

        if(user.isDisabled){
            return res.status(400).json({ message: "User is disabled" });
        }

        const { aiId , interest , description , reasonForInterest , ageWhileInterest , acheivements } = req.body;

        if( !aiId || !interest || !description || !reasonForInterest || !ageWhileInterest ){
            return res.status(400).json({ message: "All fields are required" });
        }

        if (interest.length > 40 || description.length > 100){
            return res.status(400).json({ message: "Interest and description must be less than 40 and 100 characters respectively" });
        }

        if (reasonForInterest.length > 300){
            return res.status(400).json({ message: "Reason for interest must be less than 300 characters" });
        }

        if (acheivements && acheivements.length > 5){
            return res.status(400).json({ message: "Acheivements must be less than 5" });
        }

        if ( acheivements ){
            for ( const acheivement of acheivements ){
                if (acheivement.length > 40){
                    return res.status(400).json({ message: "Acheivement must be less than 40 characters" });
                }
            }
        }

        if (isNaN(ageWhileInterest) || ageWhileInterest < 1 || ageWhileInterest > 200){
            return res.status(400).json({ message: "Age while interest must be a number between 1 and 200" });
        }

        const age = Number(ageWhileInterest)


        const ai = await AiModel.findById(aiId);

        if (!ai) {
            return res.status(404).json({ message: "AI not found" });
        }

        if (ai.madeBy.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Not your AI model" });
        }

        await dbQueues.add("createInterest", {
            aiId,
            interest,
            description,
            reasonForInterest,
            age,
            acheivements: acheivements || [],
        
        },{
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            }
        })


        return res.status(200).json({
            message: "Interest queued successfully",
        })
    } catch (error) {
        next(error)
    }
}
