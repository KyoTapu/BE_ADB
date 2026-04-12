import { Router } from "express";
import { getAdminUserById, getAllAdminUser } from "./user.controller.js";

const userRouter = Router();

userRouter.get("/:id", getAdminUserById);
userRouter.get("/", getAllAdminUser);
export default userRouter;
