import { pool } from "../../../../config/db.config.js";
import { roomRepository } from "./room.repository.js";
import {
  toRoomTypeResponse,
  toRoomTypeListResponse,
  toRoomResponse,
  toRoomListResponse,
  toRoomDetailResponse,
} from "./room.model.js";
import { hotelsService } from "../hotels/hotels.service.js";

const createError = (message, status = 400, code = "BAD_REQUEST") => {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
};

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const normalizeFacilityIds = (rawValue) => {
  if (!Array.isArray(rawValue)) return [];

  return [...new Set(
    rawValue
      .map((item) => {
        if (item && typeof item === "object") {
          return Number(item.id ?? item.service_id ?? item.facilityId ?? item.value);
        }

        return Number(item);
      })
      .filter((item) => Number.isInteger(item) && item > 0),
  )];
};

const normalizeAmenityIds = (rawValue) => {
  if (!Array.isArray(rawValue)) return [];

  return [...new Set(
    rawValue
      .map((item) => {
        if (item && typeof item === "object") {
          return Number(item.id ?? item.amenity_id ?? item.amenityId ?? item.value);
        }

        return Number(item);
      })
      .filter((item) => Number.isInteger(item) && item > 0),
  )];
};

class RoomService {
  async attachRoomTypeRelations(records) {
    if (!records.length) return [];

    const roomTypeIds = records.map((record) => record.room_type_id);
    const [amenities, facilities] = await Promise.all([
      roomRepository.getAmenitiesByRoomTypeIds(roomTypeIds),
      roomRepository.getFacilitiesByRoomTypeIds(roomTypeIds),
    ]);

    const amenitiesMap = new Map();
    for (const amenity of amenities) {
      const current = amenitiesMap.get(amenity.room_type_id) || [];
      current.push(amenity);
      amenitiesMap.set(amenity.room_type_id, current);
    }

    const facilitiesMap = new Map();
    for (const facility of facilities) {
      const current = facilitiesMap.get(facility.room_type_id) || [];
      current.push(facility);
      facilitiesMap.set(facility.room_type_id, current);
    }

    return records.map((record) => ({
      ...record,
      amenities: amenitiesMap.get(record.room_type_id) || [],
      facilities: facilitiesMap.get(record.room_type_id) || [],
    }));
  }

  async ensureFacilitiesBelongToHotel(hotelId, facilityIds, client) {
    if (!facilityIds.length) return;

    const facilities = await roomRepository.getFacilitiesByIds(facilityIds, client);

    if (facilities.length !== facilityIds.length) {
      throw createError("One or more facilities were not found", 404, "FACILITY_NOT_FOUND");
    }

    const invalid = facilities.find((facility) => facility.hotel_id !== hotelId);
    if (invalid) {
      throw createError(
        "Facilities must belong to the same hotel as the room type",
        400,
        "FACILITY_HOTEL_MISMATCH",
      );
    }
  }

  async ensureAmenitiesBelongToHotel(hotelId, amenityIds, client) {
    if (!amenityIds.length) return;

    const amenities = await roomRepository.getAmenitiesByIds(amenityIds, client);

    if (amenities.length !== amenityIds.length) {
      throw createError("One or more amenities were not found", 404, "AMENITY_NOT_FOUND");
    }

    const invalid = amenities.find((amenity) => Number(amenity.hotel_id) !== Number(hotelId));
    if (invalid) {
      throw createError(
        "Amenities must belong to the same hotel as the room type",
        400,
        "AMENITY_HOTEL_MISMATCH",
      );
    }
  }

  async getAllRoomTypes(query) {
    const data = await roomRepository.getAllRoomTypes(query);
    const records = await this.attachRoomTypeRelations(data);
    return toRoomTypeListResponse(records);
  }

  async getRoomTypeByID(id) {
    const data = await roomRepository.getRoomTypeByID(id);

    if (!data) {
      throw createError("Room type not found", 404, "ROOM_TYPE_NOT_FOUND");
    }

    const [record] = await this.attachRoomTypeRelations([data]);
    return toRoomTypeResponse(record);
  }

  async createRoomType(payload = {}) {
    const data = {
      hotel_id: Number(payload.hotel_id),
      room_type_name: payload.room_type_name?.trim(),
      room_type_base_price: Number(payload.room_type_base_price),
      room_type_services: payload.room_type_services?.trim() || null,
    };
    const facilityIds = normalizeFacilityIds(
      payload.facility_ids ?? payload.facilityIds ?? payload.facilities,
    );
    const amenityIds = normalizeAmenityIds(
      payload.amenity_ids ?? payload.amenityIds ?? payload.amenities,
    );

    if (!data.hotel_id || !data.room_type_name || Number.isNaN(data.room_type_base_price)) {
      throw createError(
        "hotel_id, room_type_name, room_type_base_price are required",
        400,
        "MISSING_ROOM_TYPE_FIELDS",
      );
    }

    await hotelsService.getHotelById(data.hotel_id);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await this.ensureFacilitiesBelongToHotel(data.hotel_id, facilityIds, client);
      await this.ensureAmenitiesBelongToHotel(data.hotel_id, amenityIds, client);

      const created = await roomRepository.createRoomType(data, client);
      await roomRepository.replaceRoomTypeFacilities(created.room_type_id, facilityIds, client);
      await roomRepository.replaceRoomTypeAmenities(created.room_type_id, amenityIds, client);

      await client.query("COMMIT");
      return await this.getRoomTypeByID(created.room_type_id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateRoomType(id, payload = {}) {
    if (!id) throw createError("Room type id is required");

    const existing = await roomRepository.getRoomTypeByID(id);
    if (!existing) {
      throw createError("Room type not found", 404, "ROOM_TYPE_NOT_FOUND");
    }

    const merged = {
      hotel_id: payload.hotel_id != null ? Number(payload.hotel_id) : existing.hotel_id,
      room_type_name: payload.room_type_name?.trim() ?? existing.room_type_name,
      room_type_base_price:
        payload.room_type_base_price != null
          ? Number(payload.room_type_base_price)
          : existing.room_type_base_price,
      room_type_services: payload.room_type_services?.trim() ?? existing.room_type_services,
    };

    if (!merged.hotel_id || !merged.room_type_name || Number.isNaN(merged.room_type_base_price)) {
      throw createError(
        "hotel_id, room_type_name, room_type_base_price are required",
        400,
        "INVALID_ROOM_TYPE_FIELDS",
      );
    }

    await hotelsService.getHotelById(merged.hotel_id);

    const shouldSyncFacilities =
      hasOwn(payload, "facility_ids") || hasOwn(payload, "facilityIds") || hasOwn(payload, "facilities");
    const shouldSyncAmenities =
      hasOwn(payload, "amenity_ids") || hasOwn(payload, "amenityIds") || hasOwn(payload, "amenities");
    const facilityIds = shouldSyncFacilities
      ? normalizeFacilityIds(payload.facility_ids ?? payload.facilityIds ?? payload.facilities)
      : [];
    const amenityIds = shouldSyncAmenities
      ? normalizeAmenityIds(payload.amenity_ids ?? payload.amenityIds ?? payload.amenities)
      : [];

    const changed = {};
    for (const key in merged) {
      if (merged[key] !== existing[key]) {
        changed[key] = merged[key];
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (shouldSyncFacilities) {
        await this.ensureFacilitiesBelongToHotel(merged.hotel_id, facilityIds, client);
      }

      if (shouldSyncAmenities) {
        await this.ensureAmenitiesBelongToHotel(merged.hotel_id, amenityIds, client);
      }

      if (Object.keys(changed).length) {
        await roomRepository.updateRoomType(id, changed, client);
      }

      if (shouldSyncFacilities) {
        await roomRepository.replaceRoomTypeFacilities(id, facilityIds, client);
      }

      if (shouldSyncAmenities) {
        await roomRepository.replaceRoomTypeAmenities(id, amenityIds, client);
      }

      await client.query("COMMIT");
      return await this.getRoomTypeByID(id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteRoomType(id) {
    const existing = await roomRepository.getRoomTypeByID(id);
    if (!existing) {
      throw createError("Room type not found", 404, "ROOM_TYPE_NOT_FOUND");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await roomRepository.deleteRoomTypeRelations(id, client);
      const deleted = await roomRepository.deleteRoomType(id, client);
      await client.query("COMMIT");

      return {
        id: deleted.room_type_id,
        deleted: true,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

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

  async getRoomWithType(id) {
    const data = await roomRepository.getRoomWithType(id);

    if (!data) {
      throw createError("Room not found", 404);
    }

    return toRoomDetailResponse(data);
  }
}

export const roomService = new RoomService();
