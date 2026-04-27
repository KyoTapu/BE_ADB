import { Router } from "express";
import { getAmenitiesStatus } from "./amenities.controller.js";

const amenitiesRouter = Router();

amenitiesRouter.get("/health", getAmenitiesStatus);

export default amenitiesRouter;
