import { Router } from "express";
import { getAdminUserById, getAllAdminUser } from "./user.controller.js";
import { authenticate, authorize } from "../../../common/auth.middleware.js";

const userRouter = Router();

userRouter.get("/:id", authenticate, authorize("admin"), getAdminUserById);
userRouter.get("/", authenticate, authorize("admin"), getAllAdminUser);
export default userRouter;
