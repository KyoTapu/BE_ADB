import { amenitiyService } from "./amenitiy.service.js";

export const getAmenitiyStatus = async (req, res, next) => {
  try {
    const data = await amenitiyService.getStatus();
    res.json(data);
  } catch (error) {
    next(error);
  }
};
