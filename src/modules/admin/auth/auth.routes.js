import { Router } from "express";
import { deleteAdmin, getAuthStatus, getMyAuthProfile, loginAdmin, setAdmin } from "./auth.controller.js";
import { authenticate, authorize } from "../../../common/auth.middleware.js";

const authRouter = Router();

authRouter.get("/health", getAuthStatus);
authRouter.post("/login", loginAdmin);
authRouter.get("/me", authenticate, getMyAuthProfile);
authRouter.post("/set-admin", authenticate, authorize("client"), setAdmin);
authRouter.post("/delete-admin", authenticate, authorize("admin"), deleteAdmin);

export default authRouter;
