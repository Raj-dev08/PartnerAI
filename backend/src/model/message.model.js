import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        userId : {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        aiId : {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AiModel",
            required: true,
        },
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },
        sentBy: {
            type: String,
            enum: ["user", "ai"],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        status:{
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending",
        }
    },{
        timestamps: true
    }
)

messageSchema.index({ createdAt: -1 , userId: 1 , aiId: 1 })

const Message = mongoose.model("Message",messageSchema)

export default Message;