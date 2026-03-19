import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        importance: {
            type: Number,
            required: true,
            default:0,
            max:10,
            min:0
        },
        messageReference: { // ai will store the one message or multiple messages reference here
            type: String,
            required: true,
        }    
    },{
        timestamps: true,
    }
)

memorySchema.index({ importance: 1 , createdAt: 1})
memorySchema.index({ userId: 1, title: 1 }, { unique: true });


const Memory = mongoose.model("Memory", memorySchema);

export default Memory;