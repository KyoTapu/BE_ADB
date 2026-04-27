import { pricingService } from "./pricing.service.js";

export const getPricingStatus = async (req, res, next) => {
  try {
    const data = await pricingService.getStatus();
    res.json(data);
  } catch (error) {
    next(error);
  }
};
