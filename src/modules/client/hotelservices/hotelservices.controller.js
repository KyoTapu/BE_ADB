import { hotelservicesService } from "./hotelservices.service.js";

export const getHotelservicesStatus = async (req, res, next) => {
  try {
    const data = await hotelservicesService.getStatus();
    res.json(data);
  } catch (error) {
    next(error);
  }
};
