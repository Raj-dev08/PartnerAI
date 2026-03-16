import Message from "../model/message.model.js";
import { messageQueue } from "../lib/message.queue.js";
import crypto from "crypto";


export const userSendsMessage = async (req, res, next) => {
    try {
        const { user } = req;
        const { content, replyngTo } = req.body; 

        if(user.isDisabled){
            return res.status(403).json({ message: "User is disabled" });
        }

        if(!content || !content.trim()){
            return res.status(400).json({ message: "Message content is required" });
        }

        if(replyngTo) {
            const reply = await Message.findById(replyngTo);

            if(!reply){
                return res.status(404).json({ message: "Reply not found" });
            }
        }

        const tempId = crypto.randomUUID();
        
      
        await messageQueue.add("processMessage", {
            userId: user._id,
            content,
            replyngTo: replyngTo || null,
            tempId
        },{
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            }
        });
            

        res.status(202).json({ 
            tempId,
            message: "Message queued successfully" ,
            status: "pending" ,
            content
        });
    } catch (error) {
        next(error);
    }
};

export const getMessages = async (req, res, next) => {
    try {
        const { user } = req;
        const { aiId } = req.params;
        const limit = parseInt(req.query.limit) || 100;
        const before = req.query.before;
        
        if(user.isDisabled){
            return res.status(403).json({ message: "User is disabled" });
        }

        const messages = await Message.find({ 
            userId: user._id,
            aiId, 
            createdAt: { $lt: before ? new Date(before) : new Date()} 
        })
            .sort({ createdAt: -1 })
            .limit(limit);
        

        messages.reverse();

        const hasMore = messages.length === limit;

        return res.status(200).json({ messages, hasMore });
                       
    } catch (error) {
        next(error);
    }
}