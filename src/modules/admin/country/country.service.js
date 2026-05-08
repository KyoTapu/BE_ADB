import { countryRepository } from "./country.repository.js";
import { toCountryListResponse, toCountryResponse } from "./country.model.js";

const createError = (message, status = 400, code = "BAD_REQUEST") => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

class CountryService {
  async getStatus() {
    const countries = await countryRepository.getAll({ limit: 1 });
    return {
      status: "ok",
      totalCountries: countries.length,
      lastUpdatedAt: countries[0]?.updated_at || null,
    };
  }

  async getAllCountries(query = {}) {
    const countries = await countryRepository.getAll(query);
    return toCountryListResponse(countries);
  }

  async getCountryById(id) {
    if (!id) {
      throw createError("Country id is required", 400, "MISSING_COUNTRY_ID");
    }

    const country = await countryRepository.getByID(id);
    if (!country) {
      throw createError("Country not found", 404, "COUNTRY_NOT_FOUND");
    }

    return toCountryResponse(country);
  }

  async createCountry(payload = {}) {
    const data = this.normalizePayload(payload);
    this.validateData(data);

    const created = await countryRepository.create(data);
    return toCountryResponse(created);
  }

  async updateCountry(id, payload = {}) {
    if (!id) {
      throw createError("Country id is required", 400, "MISSING_COUNTRY_ID");
    }

    const existing = await countryRepository.getByID(id);
    if (!existing) {
      throw createError("Country not found", 404, "COUNTRY_NOT_FOUND");
    }

    const normalized = this.normalizePayload(payload);
    const merged = {
      country_code: normalized.country_code || existing.country_code,
      country_name: normalized.country_name || existing.country_name,
    };

    this.validateData(merged);

    const changed = {};
    for (const key of ["country_code", "country_name"]) {
      if (String(merged[key] ?? "") !== String(existing[key] ?? "")) {
        changed[key] = merged[key];
      }
    }

    if (!Object.keys(changed).length) {
      return toCountryResponse(existing);
    }

    const updated = await countryRepository.update(id, changed);
    return toCountryResponse(updated);
  }

  async deleteCountry(id) {
    if (!id) {
      throw createError("Country id is required", 400, "MISSING_COUNTRY_ID");
    }

    const existing = await countryRepository.getByID(id);
    if (!existing) {
      throw createError("Country not found", 404, "COUNTRY_NOT_FOUND");
    }

    const hasHotels = await countryRepository.hasHotels(id);
    if (hasHotels) {
      throw createError(
        "Cannot delete country because it is still used by hotels",
        409,
        "COUNTRY_IN_USE",
      );
    }

    await countryRepository.hardDelete(id);
    return {
      id: Number(id),
      deleted: true,
    };
  }

  normalizePayload(payload = {}) {
    return {
      country_code: String(payload.country_code ?? payload.countryCode ?? "")
        .trim()
        .toUpperCase(),
      country_name: String(payload.country_name ?? payload.countryName ?? "").trim(),
    };
  }

  validateData(data) {
    if (!data.country_code || !data.country_name) {
      throw createError(
        "country_code and country_name are required",
        400,
        "MISSING_COUNTRY_FIELDS",
      );
    }
  }
}

export const countryService = new CountryService();
