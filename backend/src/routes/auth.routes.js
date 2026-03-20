import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { sendOtp, verifyOTP, login, logout, checkAuth, updateExpoPushToken, changePassword, deleteAccount, disableAccount, enableAccount } from "../controller/auth.controller.js";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.post("/logout", protectRoute, logout);
router.get("/check", protectRoute, checkAuth);
router.post("/update-expo-push-token", protectRoute, updateExpoPushToken);
router.post("/change-password", protectRoute, changePassword);
router.delete("/delete-account", protectRoute, deleteAccount);
router.put("/disable-account", protectRoute, disableAccount);
router.put("/enable-account", protectRoute, enableAccount);


export default router;