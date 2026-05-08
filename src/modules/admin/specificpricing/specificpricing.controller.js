import { sendSuccess } from "../../../common/response.js";
import { specificpricingService } from "./specificpricing.service.js";

export const getSpecificpricingStatus = async (req, res, next) => {
  try {
    const data = await specificpricingService.getStatus();
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getAllSpecificpricing = async (req, res, next) => {
  try {
    const data = await specificpricingService.getAll(req.query);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getSpecificpricingById = async (req, res, next) => {
  try {
    const data = await specificpricingService.getById(req.params.id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const createSpecificpricing = async (req, res, next) => {
  try {
    const data = await specificpricingService.create(req.body);
    return sendSuccess(res, data, 201);
  } catch (error) {
    next(error);
  }
};

export const updateSpecificpricing = async (req, res, next) => {
  try {
    const data = await specificpricingService.update(req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const deleteSpecificpricing = async (req, res, next) => {
  try {
    const data = await specificpricingService.delete(req.params.id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
