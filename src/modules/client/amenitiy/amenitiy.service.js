import { amenitiyRepository } from "./amenitiy.repository.js";
import { toAmenitiyResponse } from "./amenitiy.model.js";

class AmenitiyService {
  async getStatus() {
    const record = await amenitiyRepository.getStatus();
    return toAmenitiyResponse(record);
  }
}

export const amenitiyService = new AmenitiyService();
