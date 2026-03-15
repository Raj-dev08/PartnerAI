import { Router } from "express";
import { userSendsMessage, getMessages } from "../controller/convo.controller.js";

const router = Router();

router.post("/user-sends-message", userSendsMessage);
router.get("/get-messages/:aiId", getMessages);

export default router;