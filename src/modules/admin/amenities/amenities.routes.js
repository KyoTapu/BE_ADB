import { Router } from "express";
import {
  createAmenity,
  deleteAmenity,
  getAllAmenities,
  getAmenityById,
  getAmenitiesStatus,
  updateAmenity,
} from "./amenities.controller.js";
import { authenticate, authorize } from "../../../common/auth.middleware.js";

const amenitiesRouter = Router();

amenitiesRouter.get("/health", getAmenitiesStatus);
amenitiesRouter.get("/", getAllAmenities);
amenitiesRouter.get("/:id", getAmenityById);
amenitiesRouter.post("/", authenticate, authorize("admin"), createAmenity);
amenitiesRouter.put("/:id", authenticate, authorize("admin"), updateAmenity);
amenitiesRouter.delete("/:id", authenticate, authorize("admin"), deleteAmenity);

export default amenitiesRouter;
