import { Router } from "express";
import { getSpecificpricingStatus } from "./specificpricing.controller.js";

const specificpricingRouter = Router();

specificpricingRouter.get("/health", getSpecificpricingStatus);

export default specificpricingRouter;
