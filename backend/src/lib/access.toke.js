import jwt from "jsonwebtoken"
import { redis } from "./redis.js"
import User from "../model/user.model.js";

export const generateAccessToken = async(refreshToken) => {
    const sessionData = await redis.get(`sessionId:${refreshToken}`)

    if (!sessionData) {
        throw new Error("Unauthorized");
    }

    const { userId, refreshTokenVersion } = JSON.parse(sessionData)

    const user = await User.findById(userId)

    if(!user || user.refreshTokenVersion !== refreshTokenVersion){
        throw new Error("Unauthorized");
    }

    const token = jwt.sign({ userId: user._id, sessionId: refreshToken}, process.env.JWT_SECRET, { expiresIn: "15m" })

    return  { token , user };
}