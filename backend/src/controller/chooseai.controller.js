import AiModel from "../model/ai.model.js";

export const firstAIModel = async(req,res,next) => {
    try {
        const { user } = req;

        if ( user.isDisabled ){
            return res.status(400).json({ message: "User is disabled" });   
        }

        if ( user.AiModel ){
            return res.status(400).json({ message: "User already has an AI model" });
        }

        const totalAICount = await AiModel.countDocuments({ isVerified: true});

        if( totalAICount === 0 ){
            return res.status(400).json({ message: "No verified AI models found" });
        }
        const randomIndex = Math.floor(Math.random() * totalAICount);

        const aiModel = await AiModel.findOne({ isVerified: true }).skip(randomIndex);

        if (!aiModel) {
            return res.status(404).json({ message: "No verified AI models found" });
        }

        if (!aiModel.eligibleRater.includes(user._id)){
            aiModel.eligibleRater.push(user._id);
            await aiModel.save();
        }

        user.AiModel = aiModel._id;
        await user.save();

        return res.status(200).json({
            message: "AI model assigned successfully",
            aiModel
        });
    } catch (error) {
        next(error)
    }
}

export const switchAIModel = async(req,res,next) => {
    try {
        const { user } = req;

        if ( user.isDisabled ){
            return res.status(400).json({ message: "User is disabled" });        
        }

        if (!user.AiModel ){
            return res.status(400).json({ message: "User does not have an AI model" });
        }
        
        const totalAICount = await AiModel.countDocuments({ _id: { $ne: user.AiModel }})

        if( totalAICount === 0 ){
            return res.status(400).json({ message: "No new AI models found" });
        }
        const random = Math.floor(Math.random() * totalAICount)

        const aiModel = await AiModel.findOne({ _id: { $ne: user.AiModel } }).skip(random)

        if (!aiModel){
            return res.status(404).json({ message: "No New AI models found" });
        }

        if (!aiModel.eligibleRater.includes(user._id)){
            aiModel.eligibleRater.push(user._id);
            await aiModel.save();
        }
        

        user.AiModel = aiModel._id;
        user.AiModelCloseness = 0;
        await user.save();

        return res.status(200).json({
            message: "AI model switched successfully",
            aiModel
        });
    } catch (error) {
        next(error)
    }
}

export const getAIModel = async(req,res,next) => {
    try {
        const { user } = req

        if( user.isDisabled ){
            return res.status(400).json({ message: "User is disabled" });
        }

        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        

        const searchConditions = {
            $or: [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ]
        };



        const aiModels = await AiModel.find(searchConditions)
            .populate("madeBy", "name email")
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ totalRated: -1, ratings: -1});

        const total = await AiModel.countDocuments(searchConditions);

        return res.status(200).json({
            message: "AI models fetched successfully",
            aiModels,
            total
        });
    } catch (error) {
        next(error)
    }
}

export const setAIModel = async(req,res,next) => {
    try {
        const { user } = req
        const { id } = req.params

        if ( user.isDisabled ){
            return res.status(400).json({ message: "User is disabled" });
        }

        if(!id){
            return res.status(400).json({ message: "AI model id is required" });
        }

        const aiModel = await AiModel.findById(id)

        if(!aiModel){
            return res.status(404).json({ message: "AI model not found" });
        }

        if (!aiModel.eligibleRater.includes(user._id)){
            aiModel.eligibleRater.push(user._id);
            await aiModel.save();
        }

        user.AiModel = aiModel._id;
        await user.save();

        return res.status(200).json({
            message: "AI model set successfully",
            aiModel
        });
    } catch (error) {
        next(error)
    }
}

export const getMyAIModel = async(req,res,next) => {
    try {
        const { user } = req

        if ( user.isDisabled){
            return res.status(400).json({ message: "User is disabled" });
        }

        if(!user.AiModel){
            return res.status(404).json({ message: "User does not have an AI model" });
        }

        const aiModel = await AiModel.findById(user.AiModel)
            .populate("madeBy", "name email")

        if (!aiModel){
            return res.status(404).json({ message: "AI model not found" });
        }

        return  res.status(200).json({
            message: "AI model fetched successfully",
            aiModel
        });
    } catch (error) {
        next(error)
    }
}

export const rateAIModel = async(req,res,next) => {
    try {
        const { user } = req
        const { id } = req.params
        const { rating } = req.body

        if (user.isDisabled){
            return res.status(400).json({ message: "User is disabled" });
        }

        if (!id || rating === undefined){
            return res.status(400).json({ message: "AI model id and rating are required" });
        }

        if ( isNaN(rating) || rating < 0 || rating > 5 ){
            return res.status(400).json({ message: "Invalid rating" });
        }
        
        const aiModel = await AiModel.findById(id)

        if (!aiModel){
            return res.status(404).json({ message: "AI model not found" });
        }

        if (!aiModel.eligibleRater.includes(user._id)){
            return res.status(400).json({ message: "User is not eligible to rate this AI model" });
        }

        if( aiModel.totalRaters.includes(user._id)){
            return res.status(400).json({ message: "User has already rated this AI model" });
        }

        aiModel.ratings = ( aiModel.ratings * aiModel.totalRated + rating ) / (aiModel.totalRated+1);
        aiModel.totalRated+=1;
        aiModel.totalRaters.push(user._id);
        await aiModel.save();

        return res.status(200).json({
            message: "AI model rated successfully",
            aiModel
        });
    } catch (error) {
        next(error)
    }
}
