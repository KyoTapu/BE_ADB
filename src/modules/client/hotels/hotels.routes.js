import { Router } from "express";
import { getAllHotels, getHotelById, getHotelsStatus } from "./hotels.controller.js";

const hotelsRouter = Router();

hotelsRouter.get("/health", getHotelsStatus);
hotelsRouter.get("/", getAllHotels);
hotelsRouter.get("/:id", getHotelById);

export default hotelsRouter;
