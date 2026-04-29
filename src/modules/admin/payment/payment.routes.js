import { Router } from "express";
import { getHistory, createManual } from "./payment.controller.js";
import { authenticate, authorize } from "../../../common/auth.middleware.js";

const paymentRouter = Router();

paymentRouter.use(authenticate, authorize('admin', 'staff'));

paymentRouter.get("/history", getHistory);
paymentRouter.post("/manual", createManual);

export default paymentRouter;
