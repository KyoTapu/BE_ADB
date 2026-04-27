import { sendSuccess } from "../../../common/response.js";
import { roomService } from "./room.service.js";

/* =========================
   ROOM TYPE
========================= */

export const getAllRoomTypes = async (req, res, next) => {
  try {
    const data = await roomService.getAllRoomTypes(req.query);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getRoomTypeById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = await roomService.getRoomTypeByID(id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const createRoomType = async (req, res, next) => {
  try {
    const payload = req.body;
    const data = await roomService.createRoomType(payload);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const updateRoomType = async (req, res, next) => {
  try {
    const id = req.params.id;
    const payload = req.body;
    const data = await roomService.updateRoomType(id, payload);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const deleteRoomType = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = await roomService.deleteRoomType(id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/* =========================
   ROOMS
========================= */

export const getAllRooms = async (req, res, next) => {
  try {
    const query = {
      ...req.query,
      room_type_id: req.params.roomTypeId, // 🔥 filter
    };

    const data = await roomService.getAllRooms(query);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getRoomById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = await roomService.getRoomByID(id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const createRoom = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      room_type_id: req.params.roomTypeId, // 🔥 lấy từ URL
    };

    const data = await roomService.createRoom(payload);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const id = req.params.id;
    const payload = req.body;
    const data = await roomService.updateRoom(id, payload);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const deleteRoom = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = await roomService.deleteRoom(id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/* =========================
   ADVANCED
========================= */

export const getRoomWithType = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = await roomService.getRoomWithType(id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
