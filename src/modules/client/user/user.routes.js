import { Router } from "express";
import { getUserStatus } from "./user.controller.js";

const userRouter = Router();

userRouter.get("/health", getUserStatus);

export default userRouter;
