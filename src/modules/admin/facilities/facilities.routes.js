import { Router } from "express";
import {
  createFacility,
  deleteFacility,
  getAllFacilities,
  getFacilitiesStatus,
  getFacilityById,
  updateFacility,
} from "./facilities.controller.js";
import { authenticate, authorize } from "../../../common/auth.middleware.js";

const facilitiesRouter = Router();

facilitiesRouter.get("/health", getFacilitiesStatus);
facilitiesRouter.get("/", getAllFacilities);
facilitiesRouter.get("/:id", getFacilityById);
facilitiesRouter.post("/", authenticate, authorize("admin"), createFacility);
facilitiesRouter.put("/:id", authenticate, authorize("admin"), updateFacility);
facilitiesRouter.delete("/:id", authenticate, authorize("admin"), deleteFacility);

export default facilitiesRouter;
