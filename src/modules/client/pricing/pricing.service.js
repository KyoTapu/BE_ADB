import { pricingRepository } from "./pricing.repository.js";
import { toPricingResponse } from "./pricing.model.js";

class PricingService {
  async getStatus() {
    const record = await pricingRepository.getStatus();
    return toPricingResponse(record);
  }
}

export const pricingService = new PricingService();
