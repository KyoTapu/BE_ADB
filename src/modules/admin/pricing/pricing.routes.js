import { Router } from "express";
import { getPricingStatus } from "./pricing.controller.js";

const pricingRouter = Router();

pricingRouter.get("/health", getPricingStatus);

export default pricingRouter;
