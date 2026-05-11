import { sendSuccess } from "../../common/response.js";
import { pricingRulesService } from "./pricing-rules.service.js";

export const pricingRulesController = {
  async list(req, res, next) {
    try {
      return sendSuccess(res, await pricingRulesService.list(req.query));
    } catch (error) {
      return next(error);
    }
  },

  async getById(req, res, next) {
    try {
      return sendSuccess(res, await pricingRulesService.getById(req.params.id));
    } catch (error) {
      return next(error);
    }
  },

  async create(req, res, next) {
    try {
      return sendSuccess(res, await pricingRulesService.create(req.body), 201);
    } catch (error) {
      return next(error);
    }
  },

  async update(req, res, next) {
    try {
      return sendSuccess(res, await pricingRulesService.update(req.params.id, req.body));
    } catch (error) {
      return next(error);
    }
  },

  async remove(req, res, next) {
    try {
      return sendSuccess(res, await pricingRulesService.remove(req.params.id));
    } catch (error) {
      return next(error);
    }
  },
};
