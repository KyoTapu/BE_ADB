import { specificpricingService } from "./specificpricing.service.js";

export const getSpecificpricingStatus = async (req, res, next) => {
  try {
    const data = await specificpricingService.getStatus();
    res.json(data);
  } catch (error) {
    next(error);
  }
};
