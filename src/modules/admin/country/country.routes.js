import { Router } from "express";
import { getAllCountries, getCountryStatus } from "./country.controller.js";

const countryRouter = Router();

countryRouter.get("/health", getCountryStatus);
countryRouter.get("/", getAllCountries);

export default countryRouter;
