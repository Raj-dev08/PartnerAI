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
        age:{
            type:Number,
            required:true,
        },
        gender:{
            type:String,
            required:true,
        },
        isDisabled:{
            type:Boolean,
            default:false,
        },
        isPaid: {
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
        birthday: {
            type: Date,
            required: true,
        },
        userPictures: {
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