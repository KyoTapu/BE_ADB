import { roomRepository } from "./room.repository.js";
import {
  toRoomTypeResponse,
  toRoomTypeListResponse,
  toRoomResponse,
  toRoomListResponse,
  toRoomDetailResponse,
} from "./room.model.js";
import { hotelsService } from "../hotels/hotels.service.js";
/* =========================
   HELPER
========================= */

const createError = (message, status = 400, code = "BAD_REQUEST") => {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
};

/* =========================
   SERVICE
========================= */

class RoomService {
  /* =========================
     ROOM TYPE
  ========================= */

  async getAllRoomTypes(query) {
    const data = await roomRepository.getAllRoomTypes(query);
    return toRoomTypeListResponse(data);
  }

  async getRoomTypeByID(id) {
    const data = await roomRepository.getRoomTypeByID(id);

    if (!data) {
      throw createError("Room type not found", 404, "ROOM_TYPE_NOT_FOUND");
    }

    return toRoomTypeResponse(data);
  }

  async createRoomType(payload) {
    const data = {
      hotel_id: payload.hotel_id,
      room_type_name: payload.room_type_name?.trim(),
      room_type_base_price: payload.room_type_base_price,
      room_type_services: payload.room_type_services || null,
    };

    if (!data.hotel_id || !data.room_type_name || data.room_type_base_price == null) {
      throw createError("hotel_id, room_type_name, room_type_base_price are required", 400, "MISSING_ROOM_TYPE_FIELDS");
    }

    const isHotelExist = await hotelsService.getHotelById(hotel_id);
    if (!isHotelExist) {
      throw createError("hotel is not exist", 401, "HOTEL_IS_NOT_EXIST");
    }

    const created = await roomRepository.createRoomType(data);
    return toRoomTypeResponse(created);
  }

  async updateRoomType(id, payload = {}) {
    if (!id) throw createError("Room type id is required");

    const existing = await roomRepository.getRoomTypeByID(id);
    if (!existing) {
      throw createError("Room type not found", 404, "ROOM_TYPE_NOT_FOUND");
    }

    const merged = {
      hotel_id: payload.hotel_id ?? existing.hotel_id,
      room_type_name: payload.room_type_name?.trim() ?? existing.room_type_name,
      room_type_base_price: payload.room_type_base_price ?? existing.room_type_base_price,
      room_type_services: payload.room_type_services ?? existing.room_type_services,
    };

    // detect changed
    const changed = {};
    for (const key in merged) {
      if (merged[key] !== existing[key]) {
        changed[key] = merged[key];
      }
    }

    if (!Object.keys(changed).length) return toRoomTypeResponse(existing);

    const updated = await roomRepository.updateRoomType(id, changed);
    return toRoomTypeResponse(updated);
  }

  async deleteRoomType(id) {
    const deleted = await roomRepository.deleteRoomType(id);

    if (!deleted) {
      throw createError("Room type not found", 404);
    }

    return toRoomTypeResponse(deleted);
  }

  /* =========================
     ROOMS
  ========================= */

  async getAllRooms(query) {
    const data = await roomRepository.getAllRooms(query);
    return toRoomListResponse(data);
  }

  async getRoomByID(id) {
    const data = await roomRepository.getRoomByID(id);

    if (!data) {
      throw createError("Room not found", 404, "ROOM_NOT_FOUND");
    }

    return toRoomResponse(data);
  }

  async createRoom(payload) {
    const data = {
      room_type_id: payload.room_type_id,
      name: payload.name?.trim(),
      floor: payload.floor,
      number: payload.number?.trim(),
      capacity: payload.capacity,
      is_available: payload.is_available ?? true,
      status: payload.status || "Available",
    };

    if (!data.room_type_id || !data.name || data.capacity == null) {
      throw createError("room_type_id, name, capacity are required", 400, "MISSING_ROOM_FIELDS");
    }

    const created = await roomRepository.createRoom(data);
    return toRoomResponse(created);
  }

  async updateRoom(id, payload = {}) {
    if (!id) throw createError("Room id is required");

    const existing = await roomRepository.getRoomByID(id);
    if (!existing) {
      throw createError("Room not found", 404, "ROOM_NOT_FOUND");
    }

    const merged = {
      room_type_id: payload.room_type_id ?? existing.room_type_id,
      name: payload.name?.trim() ?? existing.name,
      floor: payload.floor ?? existing.floor,
      number: payload.number?.trim() ?? existing.number,
      capacity: payload.capacity ?? existing.capacity,
      is_available: payload.is_available ?? existing.is_available,
      status: payload.status ?? existing.status,
    };

    const changed = {};
    for (const key in merged) {
      if (merged[key] !== existing[key]) {
        changed[key] = merged[key];
      }
    }

    if (!Object.keys(changed).length) return toRoomResponse(existing);

    const updated = await roomRepository.updateRoom(id, changed);
    return toRoomResponse(updated);
  }

  async deleteRoom(id) {
    const deleted = await roomRepository.deleteRoom(id);

    if (!deleted) {
      throw createError("Room not found", 404);
    }

    return toRoomResponse(deleted);
  }

  /* =========================
     ADVANCED LOGIC 🔥
  ========================= */

  async getRoomWithType(id) {
    const data = await roomRepository.getRoomWithType(id);

    if (!data) {
      throw createError("Room not found", 404);
    }

    return toRoomDetailResponse(data);
  }
}

export const roomService = new RoomService();
