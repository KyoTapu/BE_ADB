import { roomRepository } from "./room.repository.js";

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
    return await roomRepository.getAllRoomTypes(query);
  }

  async getRoomTypeByID(id) {
    const data = await roomRepository.getRoomTypeByID(id);

    if (!data) {
      throw createError("Room type not found", 404, "ROOM_TYPE_NOT_FOUND");
    }

    return data;
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

    return await roomRepository.createRoomType(data);
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

    if (!Object.keys(changed).length) return existing;

    return await roomRepository.updateRoomType(id, changed);
  }

  async deleteRoomType(id) {
    const deleted = await roomRepository.deleteRoomType(id);

    if (!deleted) {
      throw createError("Room type not found", 404);
    }

    return deleted;
  }

  /* =========================
     ROOMS
  ========================= */

  async getAllRooms(query) {
    return await roomRepository.getAllRooms(query);
  }

  async getRoomByID(id) {
    const data = await roomRepository.getRoomByID(id);

    if (!data) {
      throw createError("Room not found", 404, "ROOM_NOT_FOUND");
    }

    return data;
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

    return await roomRepository.createRoom(data);
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

    if (!Object.keys(changed).length) return existing;

    return await roomRepository.updateRoom(id, changed);
  }

  async deleteRoom(id) {
    const deleted = await roomRepository.deleteRoom(id);

    if (!deleted) {
      throw createError("Room not found", 404);
    }

    return deleted;
  }

  /* =========================
     ADVANCED LOGIC 🔥
  ========================= */

  async getRoomWithType(id) {
    const data = await roomRepository.getRoomWithType(id);

    if (!data) {
      throw createError("Room not found", 404);
    }

    return data;
  }
}

export const roomService = new RoomService();
