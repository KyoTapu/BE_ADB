import { pricingRepository } from "../pricing/pricing.repository.js";

class SpecificpricingRepository {
  async getStatus() {
    const status = await pricingRepository.getStatus();
    return {
      status: status.status,
      total: status.specificDatePricingTotal,
    };
  }

  async getAll(query = {}) {
    return pricingRepository.getAllSpecificDatePricing(query);
  }

  async getById(id) {
    return pricingRepository.getSpecificDatePricingById(id);
  }

  async create(data) {
    return pricingRepository.createSpecificDatePricing(data);
  }

  async update(id, data) {
    return pricingRepository.updateSpecificDatePricing(id, data);
  }

  async delete(id) {
    return pricingRepository.deleteSpecificDatePricing(id);
  }
}

export const specificpricingRepository = new SpecificpricingRepository();
