import { sendSuccess } from "../../common/response.js";
import { pricingService } from "./pricing.service.js";

export const pricingController = {
  async quote(req, res, next) {
    try {
      return sendSuccess(res, await pricingService.quote(req.body));
    } catch (error) {
      return next(error);
    }
  },
};
