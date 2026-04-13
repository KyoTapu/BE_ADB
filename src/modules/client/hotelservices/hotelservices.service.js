import { hotelservicesRepository } from "./hotelservices.repository.js";
import { toHotelservicesResponse } from "./hotelservices.model.js";

class HotelservicesService {
  async getStatus() {
    const record = await hotelservicesRepository.getStatus();
    return toHotelservicesResponse(record);
  }
}

export const hotelservicesService = new HotelservicesService();
