import mongoose from "mongoose";

const aiModelSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        age: {
            type: Number, //age of the ai model it will be dynamic based on users age and then +1 or -1
            min: -50,
            max: 50,
            default: 0,
            required: true,
        },
        personalityTraits: {
            humour:{
                type: Number,
                min: 0,
                max: 10,
                default: 0,
            },
            kindness:{
                type: Number,
                min: 0,
                max: 10,
                default: 0,
            },
            sarcasm:{
                type: Number,
                min: 0,
                max: 10,
                default: 0,
            },
            coldness:{
                type: Number,
                min: 0,
                max: 10,
                default: 0,
            },
            confidence:{
                type: Number,
                min: 0,
                max: 10,
                default: 0,
            },
            newGen: { //to determine how much the ai uses new gen slang and references in its responses
                type: Number,// basically how much ball does ai know
                min: 0,
                max: 10,
                default: 0,
            },
            sweetness: {//to set how much the ai is sweet and caring in its responses
                type: Number,
                min: 0,
                max: 10,
                default: 0,
            },
        },
        pastExperiences: [ // only inject when needed to save tokens and to make it more dynamic and less static
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "PastExperience",
            }
        ],
        interests: [ // same like past experiences only inject when needed to save tokens and to make it more dynamic and less static
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Interest",
            }
        ],
        birthDate:{ // same
            type: Number,
            required:true,
            min: 1,
            max: 28,//to avoid weird calculations
        },
        birthMonth:{
            type: String,
            required:true,
            enum: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        }, // to dynamically say ais birthday
        occupation: { // irrelevant for user under 18 but can be used for older users to make the ai more relatable and to give more context about the user's life which can help the ai generate more accurate responses
            type: String,
        },
        occupationWeightage: {
            type: Number,
            min: 0,
            max: 10,
            default: 0,
        }, // to give more weightage to certain occupations in the ai's responses

        speechPatterns: {
            catchPhrases: {           
                type: [String],
                maxItems: 5,               
            },
            slangUsage: {
                type: Number,
                min: 0,
                max: 10,
                default: 0,
            }, // to determine how much slang the ai uses in its responses
            formalityLevel: {
                type: Number,
                min: 0,
                max: 10,
                default: 0,
            }, // to determine how formal or casual the ai's responses are
            typingStyle: {
                type: String,
                enum:["normal","emoji-heavy","lowercase","short-messages"],
                default: "normal",
            }// to determine if the ai uses emojis, gifs, or other non-textual elements in its responses
        },

        academicBackground: { // same as occupation
            type: String,
        },

        academicBackgroundWeightage: {
            type: Number,
            min: 0,
            max: 10,
            default: 0,
        }, // to give more weightage to certain academic backgrounds in the ai's responses

        expressiveness: {
            type: Number,
            min: 0,
            max: 10,
            default: 0,
            required: true,
        }, // to determine how expressive the ai is in its responses, which can influence the use of emojis, gifs, and other non-textual elements
        
        talkativeness: {
            type: Number,
            min: 0,
            max: 10,
            default: 0,
            required: true,
        }, // to determine how much the ai talks in its responses, which can influence the length and detail of its messages

        trustBuildingRate: { // gonna use it in the end of each session to update user closeness
            type: Number,
            min: 0,
            max: 10,
            default: 0,
            required: true,
        } ,// to determine how fast the ai builds trust with the user

        madeBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        ratings: {
            type: Number,
            min: 0,
            max: 5,
            default: 0,
        },

        totalRated: {
            type: Number,
            default: 0,
        },

        totalRaters:[  // because i need the highest actual rating so keeping totalRated Might be bad Fix later if issue
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            }
        ],
        eligibleRater: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            }
        ]
    }
)

aiModelSchema.index({ totalRated: -1, ratings: -1 })

const AiModel = mongoose.model("AiModel",aiModelSchema)

export default AiModel;