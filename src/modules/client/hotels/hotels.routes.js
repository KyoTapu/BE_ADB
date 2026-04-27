import { Router } from "express";
import { getHotelsStatus } from "./hotels.controller.js";
import { getAllHotels, getHotelById } from "../../admin/hotels/hotels.controller.js";
const hotelsRouter = Router();

hotelsRouter.get("/health", getHotelsStatus);
hotelsRouter.get("/", getAllHotels);
hotelsRouter.get("/:id", getHotelById);

export default hotelsRouter;
