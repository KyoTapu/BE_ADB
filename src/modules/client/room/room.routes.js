import { Router } from "express";
import { getRoomStatus } from "./room.controller.js";

const roomRouter = Router();

roomRouter.get("/health", getRoomStatus);

export default roomRouter;
