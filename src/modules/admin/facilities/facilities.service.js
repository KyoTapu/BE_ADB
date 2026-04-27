import { facilitiesRepository } from "./facilities.repository.js";
import { toFacilitiesResponse } from "./facilities.model.js";

class FacilitiesService {
  async getStatus() {
    const record = await facilitiesRepository.getStatus();
    return toFacilitiesResponse(record);
  }
}

export const facilitiesService = new FacilitiesService();
