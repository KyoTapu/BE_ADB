import { hotelsRepository } from "./hotels.repository.js";
import { toHotelsResponse } from "./hotels.model.js";

class HotelsService {
  async getStatus() {
    const record = await hotelsRepository.getStatus();
    return toHotelsResponse(record);
  }
}

export const hotelsService = new HotelsService();
