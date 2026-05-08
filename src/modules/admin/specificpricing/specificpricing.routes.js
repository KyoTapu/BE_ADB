import { Router } from "express";
import { authenticate, authorize } from "../../../common/auth.middleware.js";
import {
  createSpecificpricing,
  deleteSpecificpricing,
  getAllSpecificpricing,
  getSpecificpricingById,
  getSpecificpricingStatus,
  updateSpecificpricing,
} from "./specificpricing.controller.js";

const specificpricingRouter = Router();

specificpricingRouter.get("/health", getSpecificpricingStatus);
specificpricingRouter.get("/", getAllSpecificpricing);
specificpricingRouter.get("/:id", getSpecificpricingById);
specificpricingRouter.post("/", authenticate, authorize("admin"), createSpecificpricing);
specificpricingRouter.put("/:id", authenticate, authorize("admin"), updateSpecificpricing);
specificpricingRouter.delete("/:id", authenticate, authorize("admin"), deleteSpecificpricing);

export default specificpricingRouter;
