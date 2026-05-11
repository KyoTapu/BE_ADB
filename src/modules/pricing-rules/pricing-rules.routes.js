import { Router } from "express";
import { pricingRulesController } from "./pricing-rules.controller.js";
import { pricingRulesModel } from "./pricing-rules.model.js";

const router = Router();

router.get("/", pricingRulesController.list);
router.get("/:id", pricingRulesController.getById);
router.post("/", pricingRulesController.create);
router.patch("/:id", pricingRulesController.update);
router.delete("/:id", pricingRulesController.remove);

export const pricingRulesRoute = {
  moduleName: pricingRulesModel.moduleName,
  routePath: pricingRulesModel.routePath,
  router,
};
