import mongoose from "mongoose";

const pastExperienceSchema = new mongoose.Schema(
    {
        aiId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "AiModel",
            required: true,
        },
        event:{
            type: String,
            required: true,
            maxLength: 40,
        },
        description:{
            type: String,
            required: true,
            maxLength: 100,
        },
        ageDuringEvent:{
            type: Number,
            required: true,
        },
    }
)
pastExperienceSchema.index({ aiId: 1, event: 1 }, { unique: true });


const PastExperience = mongoose.model("PastExperience",pastExperienceSchema)

export default PastExperience;