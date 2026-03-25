import mongoose from "mongoose";

const aimemorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        aiId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AiModel",
            required: true,
        },
        memory:{
            type: String,
            required: true,
            maxLength: 10000
        }
    }, {
        timestamps: true
    }
)

const aiMemory = mongoose.model("AiMemory", aimemorySchema);

export default aiMemory;