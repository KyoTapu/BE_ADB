import { Router } from "express";
import { pricingController } from "./pricing.controller.js";
import { pricingModel } from "./pricing.model.js";

const router = Router();
router.post("/quote", pricingController.quote);

export const pricingRoute = {
  moduleName: pricingModel.moduleName,
  routePath: pricingModel.routePath,
  router,
};
