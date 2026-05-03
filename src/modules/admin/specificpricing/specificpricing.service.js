import { specificpricingRepository } from "./specificpricing.repository.js";
import { toSpecificpricingResponse } from "./specificpricing.model.js";

class SpecificpricingService {
  async getStatus() {
    const record = await specificpricingRepository.getStatus();
    return toSpecificpricingResponse(record);
  }
}

export const specificpricingService = new SpecificpricingService();
