import { amenitiesRepository } from "./amenities.repository.js";
import { toAmenitiesListResponse, toAmenitiesResponse } from "./amenities.model.js";

const createError = (message, status = 400, code = "BAD_REQUEST") => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

class AmenitiesService {
  async getStatus() {
    return amenitiesRepository.getStatus();
  }

  async getAllAmenities(query = {}) {
    const records = await amenitiesRepository.getAll(query);
    return toAmenitiesListResponse(records);
  }

  async getAmenityById(id) {
    if (!id) {
      throw createError("Amenity id is required", 400, "MISSING_AMENITY_ID");
    }

    const record = await amenitiesRepository.getByID(id);
    if (!record) {
      throw createError("Amenity not found", 404, "AMENITY_NOT_FOUND");
    }

    return toAmenitiesResponse(record);
  }

  async createAmenity(payload = {}) {
    const data = {
      room_type_id: payload.room_type_id,
      amenity_name: String(payload.amenity_name || "").trim(),
      amenity_description: payload.amenity_description ?? payload.description ?? null,
    };

    if (!data.room_type_id || !data.amenity_name) {
      throw createError("room_type_id and amenity_name are required", 400, "MISSING_AMENITY_FIELDS");
    }

    const roomTypeExists = await amenitiesRepository.roomTypeExists(data.room_type_id);
    if (!roomTypeExists) {
      throw createError("Room type not found", 404, "ROOM_TYPE_NOT_FOUND");
    }

    const created = await amenitiesRepository.create(data);
    return toAmenitiesResponse(created);
  }

  async updateAmenity(id, payload = {}) {
    if (!id) {
      throw createError("Amenity id is required", 400, "MISSING_AMENITY_ID");
    }

    const existing = await amenitiesRepository.getByID(id);
    if (!existing) {
      throw createError("Amenity not found", 404, "AMENITY_NOT_FOUND");
    }

    const merged = {
      room_type_id: payload.room_type_id ?? existing.room_type_id,
      amenity_name: payload.amenity_name?.trim() ?? existing.amenity_name,
      amenity_description:
        payload.amenity_description?.trim() ??
        payload.description?.trim() ??
        existing.amenity_description,
    };

    if (!merged.room_type_id || !merged.amenity_name) {
      throw createError("room_type_id and amenity_name are required", 400, "INVALID_AMENITY_FIELDS");
    }

    if (merged.room_type_id !== existing.room_type_id) {
      const roomTypeExists = await amenitiesRepository.roomTypeExists(merged.room_type_id);
      if (!roomTypeExists) {
        throw createError("Room type not found", 404, "ROOM_TYPE_NOT_FOUND");
      }
    }

    const changed = {};
    for (const key in merged) {
      if (merged[key] !== existing[key]) {
        changed[key] = merged[key];
      }
    }

    if (!Object.keys(changed).length) {
      return toAmenitiesResponse(existing);
    }

    const updated = await amenitiesRepository.update(id, changed);
    return toAmenitiesResponse(updated);
  }

  async deleteAmenity(id) {
    if (!id) {
      throw createError("Amenity id is required", 400, "MISSING_AMENITY_ID");
    }

    const deleted = await amenitiesRepository.delete(id);
    if (!deleted) {
      throw createError("Amenity not found", 404, "AMENITY_NOT_FOUND");
    }

    return {
      id: deleted.amenity_id,
      deleted: true,
    };
  }
}

export const amenitiesService = new AmenitiesService();
