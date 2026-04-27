import { facilitiesService } from "./facilities.service.js";

export const getFacilitiesStatus = async (req, res, next) => {
  try {
    const data = await facilitiesService.getStatus();
    res.json(data);
  } catch (error) {
    next(error);
  }
};
