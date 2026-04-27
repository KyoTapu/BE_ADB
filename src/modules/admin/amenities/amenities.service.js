import { amenitiesRepository } from "./amenities.repository.js";
import { toAmenitiesResponse } from "./amenities.model.js";

class AmenitiesService {
  async getStatus() {
    const record = await amenitiesRepository.getStatus();
    return toAmenitiesResponse(record);
  }
}

export const amenitiesService = new AmenitiesService();
