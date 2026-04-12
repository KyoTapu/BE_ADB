import { Router } from "express";
import { getAuthStatus } from "./auth.controller.js";

const authRouter = Router();

authRouter.get("/health", getAuthStatus);

export default authRouter;
