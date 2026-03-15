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
        messageReference: { // ai will store the one message or multiple messages reference here
            type: String,
            required: true,
        }    
    },{
        timestamps: true,
    }
)

const Memory = mongoose.model("Memory", memorySchema);

export default Memory;