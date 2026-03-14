import { Router } from "express";
import { createInterest } from "../controller/interest.controller.js";

const router = Router()

router.post("/create", createInterest)

export default router