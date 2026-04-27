import { Router } from "express";
import {
  getHotelsStatus,
  getAllHotels,
  getHotelById,
  createHotel,
  updateHotel,
  softDeleteHotel,
  restoreHotel,
} from "./hotels.controller.js";
import { authenticate, authorize } from "../../../common/auth.middleware.js";

const hotelsRouter = Router();

hotelsRouter.get("/health", getHotelsStatus);
hotelsRouter.get("/", getAllHotels);
hotelsRouter.get("/:id", getHotelById);
hotelsRouter.post("/", authenticate, authorize("admin"), createHotel);
hotelsRouter.put("/:id", authenticate, authorize("admin"), updateHotel);
hotelsRouter.delete("/:id", authenticate, authorize("admin"), softDeleteHotel);
hotelsRouter.patch("/:id/restore", authenticate, authorize("admin"), restoreHotel);

export default hotelsRouter;
