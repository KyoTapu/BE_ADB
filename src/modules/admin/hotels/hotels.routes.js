import { Router } from "express";
import { getHotelsStatus } from "./hotels.controller.js";

const hotelsRouter = Router();

hotelsRouter.get("/health", getHotelsStatus);

export default hotelsRouter;
