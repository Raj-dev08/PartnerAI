import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
        },
        email:{
            type:String,
            required:true,
            unique:true,
        },
        password:{
            type:String,
            required:true,
            minlength:4
        },
        expoPushToken:{
            type:String,
        },
        refreshTokenVersion:{
            type:Number,
            default:0,
        },
        age:{
            type:Number,
            default: 18
        },
        gender:{
            type:String,
            required:true,
        },
        isDisabled:{
            type:Boolean,
            default:false,
        },
        isPaid: { // kinda not needed in begining later redis store fall back 
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        memories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Memory",
            }
        ],
        birthday: { // will be used to generate birthday wishes and to help the AI understand the user's age and life stage, which can influence the tone and content of its responses.
            type: Date,
            required: true,
        },
        userPictures: { // users can upload images of themselves to help the AI generate more accurate responses based on their appearance and expressions.
            type: [String],
            default: [""],
        },
        conversations: [ //it will be a chat session each containing multiple messages so u can delete chunks
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Conversation",
            }
        ]
    }
)

const User = mongoose.model("User",userSchema)

export default User;