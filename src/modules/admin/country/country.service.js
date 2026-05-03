import { countryRepository } from "./country.repository.js";
import { toCountryListResponse } from "./country.model.js";

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
}

export const countryService = new CountryService();
