import { Router } from "express";
import { authenticate, authorize } from "../../../common/auth.middleware.js";
import {
  createSeasonalPricing,
  createSpecificDatePricing,
  deleteSeasonalPricing,
  deleteSpecificDatePricing,
  getAllSeasonalPricing,
  getAllSpecificDatePricing,
  getPricingStatus,
  getSeasonalPricingById,
  getSpecificDatePricingById,
  updateSeasonalPricing,
  updateSpecificDatePricing,
} from "./pricing.controller.js";

const pricingRouter = Router();

pricingRouter.get("/health", getPricingStatus);

pricingRouter.get("/seasonal-pricing", getAllSeasonalPricing);
pricingRouter.get("/seasonal-pricing/:id", getSeasonalPricingById);
pricingRouter.post(
  "/seasonal-pricing",
  authenticate,
  authorize("admin"),
  createSeasonalPricing,
);
pricingRouter.put(
  "/seasonal-pricing/:id",
  authenticate,
  authorize("admin"),
  updateSeasonalPricing,
);
pricingRouter.delete(
  "/seasonal-pricing/:id",
  authenticate,
  authorize("admin"),
  deleteSeasonalPricing,
);

pricingRouter.get("/specific-date-pricing", getAllSpecificDatePricing);
pricingRouter.get("/specific-date-pricing/:id", getSpecificDatePricingById);
pricingRouter.post(
  "/specific-date-pricing",
  authenticate,
  authorize("admin"),
  createSpecificDatePricing,
);
pricingRouter.put(
  "/specific-date-pricing/:id",
  authenticate,
  authorize("admin"),
  updateSpecificDatePricing,
);
pricingRouter.delete(
  "/specific-date-pricing/:id",
  authenticate,
  authorize("admin"),
  deleteSpecificDatePricing,
);

export default pricingRouter;
