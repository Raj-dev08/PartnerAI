import { v4 as uuidv4 } from "uuid"
import { redis } from "./redis.js"

export const generateSessionId = async(userId, refreshTokenVersion) => {
    const sessionID = uuidv4();
    const payload = { userId, refreshTokenVersion }   
    await redis.set(`sessionId:${sessionID}`, JSON.stringify(payload), "EX", 7 * 24 * 60 * 60); // expires in 7 days
    return sessionID;
}