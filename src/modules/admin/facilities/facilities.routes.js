import { Router } from "express";
import { getFacilitiesStatus } from "./facilities.controller.js";

const facilitiesRouter = Router();

facilitiesRouter.get("/health", getFacilitiesStatus);

export default facilitiesRouter;
