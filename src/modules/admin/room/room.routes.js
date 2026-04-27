import { Router } from "express";
import {
  // ROOM TYPE
  getAllRoomTypes,
  getRoomTypeById,
  createRoomType,
  updateRoomType,
  deleteRoomType,

  // ROOMS
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from "./room.controller.js";
import { authenticate, authorize } from "../../../common/auth.middleware.js";

const roomRouter = Router();

/* =========================
   ROOM TYPE (PARENT)
========================= */

roomRouter.get("/:roomTypeId/rooms", getAllRooms);
roomRouter.post("/:roomTypeId/rooms", authenticate, authorize("admin"), createRoom);

roomRouter.get("/rooms/:id", getRoomById);
roomRouter.put("/rooms/:id", authenticate, authorize("admin"), updateRoom);
roomRouter.delete("/rooms/:id", authenticate, authorize("admin"), deleteRoom);

roomRouter.get("", getAllRoomTypes);
roomRouter.get("/:id", getRoomTypeById);
roomRouter.post("", authenticate, authorize("admin"), createRoomType);
roomRouter.put("/:id", authenticate, authorize("admin"), updateRoomType);
roomRouter.delete("/:id", authenticate, authorize("admin"), deleteRoomType);

export default roomRouter;
