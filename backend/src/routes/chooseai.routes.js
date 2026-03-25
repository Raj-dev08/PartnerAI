import { Router } from "express";
import { firstAIModel, switchAIModel, removeAIModel,  getAIModel, setAIModel, getMyAIModel, rateAIModel, reccomendedAIModel } from "../controller/chooseai.controller.js";

const router = Router();

router.get("/get-ai-model", getAIModel);
router.get("/get-my-ai-model", getMyAIModel);
router.put("/remove-ai-model", removeAIModel);
router.put("/first-ai-model", firstAIModel);
router.put("/switch-ai-model", switchAIModel);
router.put("/set-ai-model/:id", setAIModel);
router.post("/rate-ai-model/:id", rateAIModel);
router.get("/reccomended-ai-model", reccomendedAIModel);


export default router;

