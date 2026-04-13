import { Router } from "express";
import {
  getAuthStatus,
  getClientAuthProfile,
  loginClient,
  registerClient,
} from "./auth.controller.js";
import { authenticate } from "../../../common/auth.middleware.js";

const authRouter = Router();

authRouter.get("/health", getAuthStatus);
authRouter.post("/register", registerClient);
authRouter.post("/login", loginClient);
authRouter.get("/me", authenticate, getClientAuthProfile);

export default authRouter;
