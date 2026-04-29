import { Router } from "express";
import { generatePayment, paymentWebhook } from "./payment.controller.js";
import { authenticate } from "../../../common/auth.middleware.js";

const paymentRouter = Router();

paymentRouter.post("/generate", authenticate, generatePayment);

paymentRouter.get("/vnpay-ipn", paymentWebhook);

export default paymentRouter;
