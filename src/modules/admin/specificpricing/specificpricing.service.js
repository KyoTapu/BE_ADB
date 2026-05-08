import { pricingService } from "../pricing/pricing.service.js";
import { toSpecificpricingStatusResponse } from "./specificpricing.model.js";
import { specificpricingRepository } from "./specificpricing.repository.js";

class SpecificpricingService {
  async getStatus() {
    const record = await specificpricingRepository.getStatus();
    return toSpecificpricingStatusResponse(record);
  }

  async getAll(query = {}) {
    return pricingService.getAllSpecificDatePricing(query);
  }

  async getById(id) {
    return pricingService.getSpecificDatePricingById(id);
  }

  async create(payload = {}) {
    return pricingService.createSpecificDatePricing(payload);
  }

  async update(id, payload = {}) {
    return pricingService.updateSpecificDatePricing(id, payload);
  }

  async delete(id) {
    return pricingService.deleteSpecificDatePricing(id);
  }
}

export const specificpricingService = new SpecificpricingService();
