import { hotelsService } from "./hotels.service.js";

export const getHotelsStatus = async (req, res, next) => {
  try {
    const data = await hotelsService.getStatus();
    res.json(data);
  } catch (error) {
    next(error);
  }
};
