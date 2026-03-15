import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        aiId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "AiModel",
            required: true,
        }, // gonna use this two later to analyze the ocnversations so that we can understand user preferences
        version:{//to determine behaviour of ai cuz humans doesnt always reply instantly if u message them randomly
            type: Number,
            required: true,
            default: 0,
        },
        messages:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Message",
            }
        ]
    },{
        timestamps: true,   
    }
)

conversationSchema.index({ userId: 1 , aiId: 1 ,updatedAt: -1 })


const Conversation = mongoose.model("Conversation",conversationSchema)

export default Conversation;