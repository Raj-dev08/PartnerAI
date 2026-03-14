import AiModel from "../model/ai.model.js";

import { dbQueues } from "../lib/db.queue.js";

//Can't delete or update the experiences as it will hender with user experience so be careful

export const createPastExperience = async (req, res, next) => {
  try {

    const { user } = req;
    const { aiId, event, description, ageDuringEvent } = req.body;

    if(user.isDisabled){
        return res.status(400).json({ message: "User is disabled" });
    }

    if(!aiId || !event || !description || !ageDuringEvent ) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if(event.length > 40 || description.length > 100){
        return res.status(400).json({ message: "Event and description must be less than 40 and 100 characters respectively" });
    }
    
    if(isNaN(ageDuringEvent) || ageDuringEvent < 1 || ageDuringEvent > 200){
        return res.status(400).json({ message: "Age during event must be a number between 1 and 200" });
    }

    const age = Number(ageDuringEvent)

    const ai = await AiModel.findById(aiId);

    if (!ai) {
      return res.status(404).json({ message: "AI not found" });
    }

    if (ai.madeBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Not your AI model" });
    }

    await dbQueues.add("createPastExperience", {
      aiId,
      event,
      description,
      age,
    },{
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000
        }
    });

    return res.status(200).json({
      message: "Past experience queued successfully",
    });

  } catch (error) {
    next(error);
  }
};
