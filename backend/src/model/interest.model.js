import mongoose from "mongoose";

const interestSchema = new mongoose.Schema(
    {
        aiId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "AiModel",
            required: true,
        },
        interest:{
            type: String,
            required: true,
            maxLength: 40,
        },
        description:{
            type: String,
            required: true,
            maxLength: 100,
        },
        reasonForInterest:{
            type: String,
            required: true,
        },
        ageWhileInterest:{
            type: Number,
            required: true,
        },
        acheivements:{
            type: [String],
            maxLength: 5,
        },
    }
)

const Interest = mongoose.model("Interest",interestSchema)

export default Interest;