import { Router } from "express";
import { getHotelservicesStatus } from "./hotelservices.controller.js";

const hotelservicesRouter = Router();

hotelservicesRouter.get("/health", getHotelservicesStatus);

export default hotelservicesRouter;
