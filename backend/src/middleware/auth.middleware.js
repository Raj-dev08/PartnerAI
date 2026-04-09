import jwt from "jsonwebtoken";
import { generateAccessToken } from "../lib/access.toke.js";
import User from "../model/user.model.js";
import { redis } from "../lib/redis.js";
import { updatePaymentStatus } from "../lib/updatePaymentStatus.js";

export const protectRoute = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const sessionId = req.headers.sessionid; // get sessionId from headers
        
        if (!sessionId ) {
            return res.status(401).json({ message: "Please log in" });
        }

        if (authHeader && !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized - no token" });
        }    

        try {

            if(!authHeader) {
                const { token, user } = await generateAccessToken(sessionId);
                res.setHeader("Authorization", `Bearer ${token}`);
                req.user = user;
                req.sessionId = sessionId;
                return next();
            }
            const accessToken = authHeader.split(" ")[1];
            const sessionData = await redis.get(`sessionId:${sessionId}`);
            
            if (!sessionData) {
                return res.status(401).json({ message: "Unauthorized - invalid session . Log in again" });
            }

            const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select("-password");
            
            if (!user) {
                return res.status(401).json({ message: "Unauthorized - user not found" });
            }

            if (user.refreshTokenVersion !== JSON.parse(sessionData).refreshTokenVersion) {
                return res.status(401).json({ message: "Unauthorized - token version mismatch. Please log in again" });
            }

            if(decoded.sessionId !== sessionId){
                return res.status(401).json({ message: "Unauthorized session mismatch" });
            }

            const success = await updatePaymentStatus(user._id)

            if(!success){
                return res.status(400).json({ message: "Payment check failed try again later"})
            }
            req.user = user; // attach user to request object
            req.sessionId = decoded.sessionId;

            

            return next();
        } catch (err) {
            if (err.name !== "TokenExpiredError") {
                return res.status(401).json({ message: "Unauthorized - invalid token" });
            }

            try {
                const { token, user } = await generateAccessToken(sessionId);
                res.setHeader("Authorization", `Bearer ${token}`);

                const success = await updatePaymentStatus(user._id)

                if(!success){
                    return res.status(400).json({ message: "Payment check failed try again later"})
                }

                req.user = user;
                req.sessionId = sessionId;

                return next();
            } catch (error) {
                return res.status(401).json({ message: error.message || "Unauthorized - could not refresh token" });
            }    
        }
    } catch (error) {
        console.log("Error in protectRoute middleware", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}