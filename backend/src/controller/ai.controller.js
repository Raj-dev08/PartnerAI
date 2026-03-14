import AiModel from "../model/ai.model.js";

export const generateAiModel = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(400).json({ message: "User is disabled" });
        }

        const {
            name,
            description,
            age,
            aiType,
            personalityTraits,
            birthDate,
            birthMonth,
            occupation,
            occupationWeightage,
            speechPatterns,
            academicBackground,
            academicBackgroundWeightage,
            expressiveness,
            talkativeness,
            trustBuildingRate
        } = req.body;

        if (
            !name || !age || !aiType || !personalityTraits ||
            !birthDate || !birthMonth || !speechPatterns ||
            !expressiveness || !talkativeness || !trustBuildingRate
        ) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (isNaN(age)) {
            return res.status(400).json({ message: "Age must be a number" });
        }

        if (age > 50 || age < -50) {
            return res.status(400).json({ message: "Age Difference must be between -50 and 50 with user" });
        }

        if (aiType.length > 20){
            return res.status(400).json({ message: "AI type must be less than 20 characters" });
        }

        if (
            isNaN(personalityTraits.humour) ||
            isNaN(personalityTraits.kindness) ||
            isNaN(personalityTraits.sarcasm) ||
            isNaN(personalityTraits.coldness) ||
            isNaN(personalityTraits.confidence) ||
            isNaN(personalityTraits.newGen) ||
            isNaN(personalityTraits.sweetness)
        ) {
            return res.status(400).json({ message: "Personality traits must be numbers" });
        }

        if (
            personalityTraits.humour < 0 || personalityTraits.humour > 10 ||
            personalityTraits.kindness < 0 || personalityTraits.kindness > 10 ||
            personalityTraits.sarcasm < 0 || personalityTraits.sarcasm > 10 ||
            personalityTraits.coldness < 0 || personalityTraits.coldness > 10 ||
            personalityTraits.confidence < 0 || personalityTraits.confidence > 10 ||
            personalityTraits.newGen < 0 || personalityTraits.newGen > 10 ||
            personalityTraits.sweetness < 0 || personalityTraits.sweetness > 10
        ) {
            return res.status(400).json({ message: "Personality traits must be between 0 and 10" });
        }

        if (isNaN(birthDate) || birthDate < 1 || birthDate > 28) {
            return res.status(400).json({ message: "Birth date must be a number between 1 and 28" });
        }

        const validMonths = [
            "January","February","March","April","May","June",
            "July","August","September","October","November","December"
        ];

        if (!validMonths.includes(birthMonth)) {
            return res.status(400).json({ message: "Birth month must be valid" });
        }

        if (
            isNaN(speechPatterns.slangUsage) ||
            isNaN(speechPatterns.formalityLevel)
        ) {
            return res.status(400).json({ message: "Speech patterns must be numbers" });
        }

        if (
            speechPatterns.slangUsage < 0 || speechPatterns.slangUsage > 10 ||
            speechPatterns.formalityLevel < 0 || speechPatterns.formalityLevel > 10
        ) {
            return res.status(400).json({ message: "Speech patterns must be between 0 and 10" });
        }

        if (speechPatterns.catchPhrases && speechPatterns.catchPhrases.length > 5) {
            return res.status(400).json({ message: "Catch phrases must be less than 5" });
        }

        if (
            speechPatterns.typingStyle &&
            !["normal", "emoji-heavy", "lowercase", "short-messages"].includes(speechPatterns.typingStyle)
        ) {
            return res.status(400).json({ message: "Invalid typing style" });
        }

        if (
            isNaN(expressiveness) ||
            isNaN(talkativeness) ||
            isNaN(trustBuildingRate)
        ) {
            return res.status(400).json({ message: "Expressiveness, talkativeness, trustBuildingRate must be numbers" });
        }

        if (
            expressiveness < 0 || expressiveness > 10 ||
            talkativeness < 0 || talkativeness > 10 ||
            trustBuildingRate < 0 || trustBuildingRate > 10
        ) {
            return res.status(400).json({ message: "Values must be between 0 and 10" });
        }

        if (occupation && (isNaN(occupationWeightage) || occupationWeightage < 0 || occupationWeightage > 10)) {
            return res.status(400).json({ message: "Occupation weightage must be between 0 and 10" });
        }

        if (academicBackground && (isNaN(academicBackgroundWeightage) || academicBackgroundWeightage < 0 || academicBackgroundWeightage > 10)) {
            return res.status(400).json({ message: "Academic background weightage must be between 0 and 10" });
        }

        const newAiModel = await AiModel.create({
            name,
            description: description || "",
            age,
            aiType,
            personalityTraits,
            birthDate,
            birthMonth,
            occupation: occupation || "",
            occupationWeightage: occupationWeightage || 0,
            speechPatterns,
            academicBackground: academicBackground || "",
            academicBackgroundWeightage: academicBackgroundWeightage || 0,
            expressiveness,
            talkativeness,
            trustBuildingRate,
            madeBy: user._id
        });

        return res.status(201).json({
            message: "AI model created successfully",
            aiModel: newAiModel
        });

    } catch (error) {
        next(error);
    }
};

export const updateAiModel = async (req, res, next) => {
    try {

        const { user } = req;
        const { id } = req.params;
        
        if( user.isDisabled){
            return res.status(400).json({ message: "User is disabled" });
        }

        const aiModel = await AiModel.findById(id);

        if (!aiModel) {
            return res.status(404).json({ message: "AI model not found" });
        }

        if (aiModel.madeBy.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        
        const { description , occupation , occupationWeightage , academicBackground , academicBackgroundWeightage } = req.body;

        const payload = {}
        if (description) {
            payload.description = description;
        }

        if (occupation ){
            payload.occupation = occupation;            
        }

         if( aiModel.occupation && occupationWeightage !== undefined && occupationWeightage > 0 && occupationWeightage <= 10 && !isNaN(occupationWeightage) )
            payload.occupationWeightage = occupationWeightage;

        if (academicBackground ){
            payload.academicBackground = academicBackground;
        }

        if ( aiModel.academicBackground && academicBackgroundWeightage !== undefined && academicBackgroundWeightage > 0 && academicBackgroundWeightage <= 10 && !isNaN(academicBackgroundWeightage))
            payload.academicBackgroundWeightage = academicBackgroundWeightage
        

        const updatedModel = await AiModel.findByIdAndUpdate(
            id,
            payload,
            { new: true}
        );

        return res.status(200).json({
            message: "AI model updated successfully",
            aiModel: updatedModel
        });

    } catch (error) {
        next(error);
    }
};

export const deleteAiModel = async (req, res, next) => {
    try {

        const { user } = req;
        const { id } = req.params;

        if(user.isDisabled){
            return res.status(400).json({ message: "User is disabled" });
        }

        const aiModel = await AiModel.findById(id);

        if (!aiModel) {
            return res.status(404).json({ message: "AI model not found" });
        }

        if (aiModel.madeBy.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await AiModel.findByIdAndDelete(id);

        return res.status(200).json({
            message: "AI model deleted successfully"
        });

    } catch (error) {
        next(error);
    }
};