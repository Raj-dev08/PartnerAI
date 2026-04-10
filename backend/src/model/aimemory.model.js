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
            default:"",
            maxLength: 10000
        }
    }, {
        timestamps: true
    }
)

aimemorySchema.index({ userId: 1}, { unique: true });

const aiMemory = mongoose.model("AiMemory", aimemorySchema);

export default aiMemory;