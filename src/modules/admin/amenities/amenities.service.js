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
      hotel_id: Number(payload.hotel_id ?? payload.hotelId),
      amenity_name: String(payload.amenity_name || "").trim(),
      amenity_description: payload.amenity_description ?? payload.description ?? null,
    };

    if (!data.hotel_id || !data.amenity_name) {
      throw createError("hotel_id and amenity_name are required", 400, "MISSING_AMENITY_FIELDS");
    }

    const hotelExists = await amenitiesRepository.hotelExists(data.hotel_id);
    if (!hotelExists) {
      throw createError("Hotel not found", 404, "HOTEL_NOT_FOUND");
    }

    const duplicated = await amenitiesRepository.getByHotelAndName(data.hotel_id, data.amenity_name);
    if (duplicated) {
      throw createError("Amenity already exists for this hotel", 409, "AMENITY_ALREADY_EXISTS");
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
      hotel_id:
        payload.hotel_id != null || payload.hotelId != null
          ? Number(payload.hotel_id ?? payload.hotelId)
          : existing.hotel_id,
      amenity_name: payload.amenity_name?.trim() ?? existing.amenity_name,
      amenity_description:
        payload.amenity_description?.trim() ??
        payload.description?.trim() ??
        existing.amenity_description,
    };

    if (!merged.hotel_id || !merged.amenity_name) {
      throw createError("hotel_id and amenity_name are required", 400, "INVALID_AMENITY_FIELDS");
    }

    if (Number(merged.hotel_id) !== Number(existing.hotel_id)) {
      const hotelExists = await amenitiesRepository.hotelExists(merged.hotel_id);
      if (!hotelExists) {
        throw createError("Hotel not found", 404, "HOTEL_NOT_FOUND");
      }
    }

    const duplicated = await amenitiesRepository.getByHotelAndName(merged.hotel_id, merged.amenity_name);
    if (duplicated && Number(duplicated.amenity_id) !== Number(id)) {
      throw createError("Amenity already exists for this hotel", 409, "AMENITY_ALREADY_EXISTS");
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

    await amenitiesRepository.deleteRoomTypeLinksByAmenityId(id);
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
