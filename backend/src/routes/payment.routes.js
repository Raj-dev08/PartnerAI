import { createPlans, getPaymentById, getPlans, subscribePlan, payForSubscription, getUserSubscriptionAndPayment, restartSubscription  } from "../controller/payment.controller.js";
import { Router } from "express"

const router = Router()


router.get("/user-subscription",getUserSubscriptionAndPayment)
router.get("/all-plans",getPlans)
router.post("/create-plan",createPlans)
router.get("/:id",getPaymentById)
router.put("/subscribe-plan/:id",subscribePlan)
router.post("/pay/:id",payForSubscription)
router.post("/restart-subscription",restartSubscription)

export default router