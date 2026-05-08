import { pricingRepository } from "./pricing.repository.js";
import {
  toSeasonalPricingListResponse,
  toSeasonalPricingResponse,
  toSpecificDatePricingListResponse,
  toSpecificDatePricingResponse,
} from "./pricing.model.js";

const createError = (message, status = 400, code = "BAD_REQUEST") => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

const normalizeDateInput = (rawValue, fieldName) => {
  const value = String(rawValue || "").trim();
  if (!value) {
    return "";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw createError(`${fieldName} must be in YYYY-MM-DD format`, 400, "INVALID_DATE_FORMAT");
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw createError(`${fieldName} is not a valid calendar date`, 400, "INVALID_DATE_VALUE");
  }

  return value;
};

class PricingService {
  async getStatus() {
    return pricingRepository.getStatus();
  }

  async getAllSeasonalPricing(query = {}) {
    const records = await pricingRepository.getAllSeasonalPricing(query);
    return toSeasonalPricingListResponse(records);
  }

  async getSeasonalPricingById(id) {
    if (!id) {
      throw createError("Seasonal pricing id is required", 400, "MISSING_SEASONAL_PRICING_ID");
    }

    const record = await pricingRepository.getSeasonalPricingById(id);
    if (!record) {
      throw createError("Seasonal pricing not found", 404, "SEASONAL_PRICING_NOT_FOUND");
    }

    return toSeasonalPricingResponse(record);
  }

  async createSeasonalPricing(payload = {}) {
    const data = {
      hotel_id: Number(payload.hotel_id ?? payload.hotelId),
      start_date: normalizeDateInput(payload.start_date ?? payload.startDate, "start_date"),
      end_date: normalizeDateInput(payload.end_date ?? payload.endDate, "end_date"),
      multiplier: payload.multiplier,
    };

    this.validateSeasonalPricingData(data);

    const hotelExists = await pricingRepository.hotelExists(data.hotel_id);
    if (!hotelExists) {
      throw createError("Hotel not found", 404, "HOTEL_NOT_FOUND");
    }

    await this.ensureSeasonalPricingDoesNotOverlap(data);

    const created = await pricingRepository.createSeasonalPricing(data);
    return toSeasonalPricingResponse(created);
  }

  async updateSeasonalPricing(id, payload = {}) {
    if (!id) {
      throw createError("Seasonal pricing id is required", 400, "MISSING_SEASONAL_PRICING_ID");
    }

    const existing = await pricingRepository.getSeasonalPricingById(id);
    if (!existing) {
      throw createError("Seasonal pricing not found", 404, "SEASONAL_PRICING_NOT_FOUND");
    }

    const merged = {
      hotel_id: payload.hotel_id != null || payload.hotelId != null
        ? Number(payload.hotel_id ?? payload.hotelId)
        : existing.hotel_id,
      start_date:
        payload.start_date != null || payload.startDate != null
          ? normalizeDateInput(payload.start_date ?? payload.startDate, "start_date")
          : existing.start_date,
      end_date:
        payload.end_date != null || payload.endDate != null
          ? normalizeDateInput(payload.end_date ?? payload.endDate, "end_date")
          : existing.end_date,
      multiplier:
        payload.multiplier != null ? payload.multiplier : existing.multiplier,
    };

    this.validateSeasonalPricingData(merged);

    if (Number(merged.hotel_id) !== Number(existing.hotel_id)) {
      const hotelExists = await pricingRepository.hotelExists(merged.hotel_id);
      if (!hotelExists) {
        throw createError("Hotel not found", 404, "HOTEL_NOT_FOUND");
      }
    }

    await this.ensureSeasonalPricingDoesNotOverlap(merged, id);

    const changed = {};
    for (const key in merged) {
      if (String(merged[key]) !== String(existing[key])) {
        changed[key] = merged[key];
      }
    }

    if (!Object.keys(changed).length) {
      return toSeasonalPricingResponse(existing);
    }

    const updated = await pricingRepository.updateSeasonalPricing(id, changed);
    return toSeasonalPricingResponse(updated);
  }

  async deleteSeasonalPricing(id) {
    if (!id) {
      throw createError("Seasonal pricing id is required", 400, "MISSING_SEASONAL_PRICING_ID");
    }

    const deleted = await pricingRepository.deleteSeasonalPricing(id);
    if (!deleted) {
      throw createError("Seasonal pricing not found", 404, "SEASONAL_PRICING_NOT_FOUND");
    }

    return {
      id: deleted.season_id,
      deleted: true,
    };
  }

  async getAllSpecificDatePricing(query = {}) {
    const records = await pricingRepository.getAllSpecificDatePricing(query);
    return toSpecificDatePricingListResponse(records);
  }

  async getSpecificDatePricingById(id) {
    if (!id) {
      throw createError("Specific date pricing id is required", 400, "MISSING_SPECIFIC_DATE_PRICING_ID");
    }

    const record = await pricingRepository.getSpecificDatePricingById(id);
    if (!record) {
      throw createError("Specific date pricing not found", 404, "SPECIFIC_DATE_PRICING_NOT_FOUND");
    }

    return toSpecificDatePricingResponse(record);
  }

  async createSpecificDatePricing(payload = {}) {
    const data = {
      room_type_id: Number(payload.room_type_id ?? payload.roomTypeId),
      specific_date: normalizeDateInput(
        payload.specific_date ?? payload.specificDate,
        "specific_date",
      ),
      specific_rate: payload.specific_rate ?? payload.specificRate,
      specific_note: payload.specific_note ?? payload.specificNote ?? null,
    };

    this.validateSpecificDatePricingData(data);

    const roomTypeExists = await pricingRepository.roomTypeExists(data.room_type_id);
    if (!roomTypeExists) {
      throw createError("Room type not found", 404, "ROOM_TYPE_NOT_FOUND");
    }

    await this.ensureSpecificDatePricingIsUnique(data);

    const created = await pricingRepository.createSpecificDatePricing(data);
    return toSpecificDatePricingResponse(created);
  }

  async updateSpecificDatePricing(id, payload = {}) {
    if (!id) {
      throw createError("Specific date pricing id is required", 400, "MISSING_SPECIFIC_DATE_PRICING_ID");
    }

    const existing = await pricingRepository.getSpecificDatePricingById(id);
    if (!existing) {
      throw createError("Specific date pricing not found", 404, "SPECIFIC_DATE_PRICING_NOT_FOUND");
    }

    const merged = {
      room_type_id:
        payload.room_type_id != null || payload.roomTypeId != null
          ? Number(payload.room_type_id ?? payload.roomTypeId)
          : existing.room_type_id,
      specific_date:
        payload.specific_date != null || payload.specificDate != null
          ? normalizeDateInput(payload.specific_date ?? payload.specificDate, "specific_date")
          : existing.specific_date,
      specific_rate:
        payload.specific_rate != null || payload.specificRate != null
          ? payload.specific_rate ?? payload.specificRate
          : existing.specific_rate,
      specific_note:
        payload.specific_note !== undefined || payload.specificNote !== undefined
          ? payload.specific_note ?? payload.specificNote ?? null
          : existing.specific_note,
    };

    this.validateSpecificDatePricingData(merged);

    if (Number(merged.room_type_id) !== Number(existing.room_type_id)) {
      const roomTypeExists = await pricingRepository.roomTypeExists(merged.room_type_id);
      if (!roomTypeExists) {
        throw createError("Room type not found", 404, "ROOM_TYPE_NOT_FOUND");
      }
    }

    await this.ensureSpecificDatePricingIsUnique(merged, id);

    const changed = {};
    for (const key in merged) {
      if (String(merged[key] ?? "") !== String(existing[key] ?? "")) {
        changed[key] = merged[key];
      }
    }

    if (!Object.keys(changed).length) {
      return toSpecificDatePricingResponse(existing);
    }

    const updated = await pricingRepository.updateSpecificDatePricing(id, changed);
    return toSpecificDatePricingResponse(updated);
  }

  async deleteSpecificDatePricing(id) {
    if (!id) {
      throw createError("Specific date pricing id is required", 400, "MISSING_SPECIFIC_DATE_PRICING_ID");
    }

    const deleted = await pricingRepository.deleteSpecificDatePricing(id);
    if (!deleted) {
      throw createError("Specific date pricing not found", 404, "SPECIFIC_DATE_PRICING_NOT_FOUND");
    }

    return {
      id: deleted.id,
      deleted: true,
    };
  }

  validateSeasonalPricingData(data) {
    if (!Number.isInteger(data.hotel_id) || data.hotel_id <= 0) {
      throw createError("hotel_id must be a positive integer", 400, "INVALID_HOTEL_ID");
    }

    if (!data.start_date || !data.end_date) {
      throw createError("start_date and end_date are required", 400, "MISSING_SEASONAL_PRICING_FIELDS");
    }

    const multiplier = Number(data.multiplier);
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      throw createError("multiplier must be a positive number", 400, "INVALID_MULTIPLIER");
    }

    if (Date.parse(`${data.start_date}T00:00:00Z`) > Date.parse(`${data.end_date}T00:00:00Z`)) {
      throw createError("start_date must be before or equal to end_date", 400, "INVALID_DATE_RANGE");
    }
  }

  validateSpecificDatePricingData(data) {
    if (!Number.isInteger(data.room_type_id) || data.room_type_id <= 0) {
      throw createError("room_type_id must be a positive integer", 400, "INVALID_ROOM_TYPE_ID");
    }

    if (!data.specific_date) {
      throw createError("specific_date is required", 400, "MISSING_SPECIFIC_DATE");
    }

    const specificRate = Number(data.specific_rate);
    if (!Number.isFinite(specificRate) || specificRate <= 0) {
      throw createError("specific_rate must be a positive number", 400, "INVALID_SPECIFIC_RATE");
    }
  }

  async ensureSeasonalPricingDoesNotOverlap(data, excludeId = null) {
    const overlap = await pricingRepository.findSeasonalPricingOverlap({
      hotelId: data.hotel_id,
      startDate: data.start_date,
      endDate: data.end_date,
      excludeId,
    });

    if (overlap) {
      throw createError(
        `Seasonal pricing overlaps with existing range ${overlap.start_date} to ${overlap.end_date}`,
        409,
        "SEASONAL_PRICING_OVERLAP",
      );
    }
  }

  async ensureSpecificDatePricingIsUnique(data, excludeId = null) {
    const conflict = await pricingRepository.findSpecificDatePricingConflict({
      roomTypeId: data.room_type_id,
      specificDate: data.specific_date,
      excludeId,
    });

    if (conflict) {
      throw createError(
        `Specific date pricing already exists for ${data.specific_date}`,
        409,
        "SPECIFIC_DATE_PRICING_DUPLICATE",
      );
    }
  }
}

export const pricingService = new PricingService();
