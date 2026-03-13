import { Router } from "express";
import { generateAiModel, updateAiModel, deleteAiModel } from "../controller/ai.controller.js";


const router = Router();

router.post("/generate", generateAiModel);
router.put("/update/:id", updateAiModel);
router.delete("/delete/:id", deleteAiModel);

export default router;