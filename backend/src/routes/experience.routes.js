import { Router } from "express";
import { createPastExperience } from "../controller/experience.controller.js";

const router = Router()

router.post("/create", createPastExperience)

export default router