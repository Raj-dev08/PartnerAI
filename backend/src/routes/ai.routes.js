import { Router } from "express";
import { generateAiModel, updateAiModel, deleteAiModel, getAiModelsCreatedByMe , getAiModelById} from "../controller/ai.controller.js";


const router = Router();

router.get("/get-my-ai-models", getAiModelsCreatedByMe);
router.get("/get-ai-model-by-id/:id", getAiModelById);
router.post("/generate", generateAiModel);
router.put("/update/:id", updateAiModel);
router.delete("/delete/:id", deleteAiModel);

export default router;