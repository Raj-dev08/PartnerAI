import mongoose from "mongoose";

const userReferenceSchema = new mongoose.Schema(
    {
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        modelReference: [
            {
                modelId:{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "AiModel",
                    required: true,
                },
                totalConvos:{
                    type: Number,
                    default: 0,
                },
                averageConvoLength:{
                    type: Number,
                    default: 0,
                },
                totalMessages:{
                    type: Number,
                    default: 0,
                },
                ratings:{
                    type: Number,
                    default: 0,
                    min: 0,
                    max: 5,
                },
                closeness:{
                    type: Number,
                    default: 0,
                }
            }
        ]
    }
)

const UserReference = mongoose.model("UserReference",userReferenceSchema)

export default UserReference;