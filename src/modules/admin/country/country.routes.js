import { Router } from "express";
import { authenticate, authorize } from "../../../common/auth.middleware.js";
import {
  createCountry,
  deleteCountry,
  getAllCountries,
  getCountryById,
  getCountryStatus,
  updateCountry,
} from "./country.controller.js";

const countryRouter = Router();

countryRouter.get("/health", getCountryStatus);
countryRouter.get("/", getAllCountries);
countryRouter.get("/:id", getCountryById);
countryRouter.post("/", authenticate, authorize("admin"), createCountry);
countryRouter.put("/:id", authenticate, authorize("admin"), updateCountry);
countryRouter.delete("/:id", authenticate, authorize("admin"), deleteCountry);

export default countryRouter;
