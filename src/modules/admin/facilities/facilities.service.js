import { facilitiesRepository } from "./facilities.repository.js";
import { toFacilitiesListResponse, toFacilitiesResponse } from "./facilities.model.js";

const createError = (message, status = 400, code = "BAD_REQUEST") => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

class FacilitiesService {
  async getStatus() {
    return facilitiesRepository.getStatus();
  }

  async getAllFacilities(query = {}) {
    const records = await facilitiesRepository.getAll(query);
    return toFacilitiesListResponse(records);
  }

  async getFacilityById(id) {
    if (!id) {
      throw createError("Facility id is required", 400, "MISSING_FACILITY_ID");
    }

    const record = await facilitiesRepository.getByID(id);
    if (!record) {
      throw createError("Facility not found", 404, "FACILITY_NOT_FOUND");
    }

    return toFacilitiesResponse(record);
  }

  async createFacility(payload = {}) {
    const data = {
      hotel_id: payload.hotel_id,
      service_name: String(payload.service_name || payload.name || "").trim(),
      service_price: payload.service_price ?? payload.price ?? null,
      pricing_type: String(payload.pricing_type || payload.pricingType || "per_use").trim(),
    };

    if (!data.hotel_id || !data.service_name) {
      throw createError("hotel_id and service_name are required", 400, "MISSING_FACILITY_FIELDS");
    }

    const hotelExists = await facilitiesRepository.hotelExists(data.hotel_id);
    if (!hotelExists) {
      throw createError("Hotel not found", 404, "HOTEL_NOT_FOUND");
    }

    const created = await facilitiesRepository.create(data);
    return toFacilitiesResponse(created);
  }

  async updateFacility(id, payload = {}) {
    if (!id) {
      throw createError("Facility id is required", 400, "MISSING_FACILITY_ID");
    }

    const existing = await facilitiesRepository.getByID(id);
    if (!existing) {
      throw createError("Facility not found", 404, "FACILITY_NOT_FOUND");
    }

    const merged = {
      hotel_id: payload.hotel_id ?? existing.hotel_id,
      service_name: payload.service_name?.trim() ?? payload.name?.trim() ?? existing.service_name,
      service_price: payload.service_price ?? payload.price ?? existing.service_price,
      pricing_type: payload.pricing_type?.trim() ?? payload.pricingType?.trim() ?? existing.pricing_type,
    };

    if (!merged.hotel_id || !merged.service_name) {
      throw createError("hotel_id and service_name are required", 400, "INVALID_FACILITY_FIELDS");
    }

    if (merged.hotel_id !== existing.hotel_id) {
      const hotelExists = await facilitiesRepository.hotelExists(merged.hotel_id);
      if (!hotelExists) {
        throw createError("Hotel not found", 404, "HOTEL_NOT_FOUND");
      }
    }

    const changed = {};
    for (const key in merged) {
      if (merged[key] !== existing[key]) {
        changed[key] = merged[key];
      }
    }

    if (!Object.keys(changed).length) {
      return toFacilitiesResponse(existing);
    }

    const updated = await facilitiesRepository.update(id, changed);
    return toFacilitiesResponse(updated);
  }

  async deleteFacility(id) {
    if (!id) {
      throw createError("Facility id is required", 400, "MISSING_FACILITY_ID");
    }

    const deleted = await facilitiesRepository.delete(id);
    if (!deleted) {
      throw createError("Facility not found", 404, "FACILITY_NOT_FOUND");
    }

    return {
      id: deleted.service_id,
      deleted: true,
    };
  }
}

export const facilitiesService = new FacilitiesService();
