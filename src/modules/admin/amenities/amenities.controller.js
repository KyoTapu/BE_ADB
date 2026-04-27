import { amenitiesService } from "./amenities.service.js";

export const getAmenitiesStatus = async (req, res, next) => {
  try {
    const data = await amenitiesService.getStatus();
    res.json(data);
  } catch (error) {
    next(error);
  }
};
