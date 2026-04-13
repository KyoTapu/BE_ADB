import { Router } from "express";
import { getPaymentStatus } from "./payment.controller.js";

const paymentRouter = Router();

paymentRouter.get("/health", getPaymentStatus);

export default paymentRouter;
