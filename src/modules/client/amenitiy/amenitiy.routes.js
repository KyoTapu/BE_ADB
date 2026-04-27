import { Router } from "express";
import { getAmenitiyStatus } from "./amenitiy.controller.js";

const amenitiyRouter = Router();

amenitiyRouter.get("/health", getAmenitiyStatus);

export default amenitiyRouter;
