import { sendSuccess } from "../../../common/response.js";
import { pricingService } from "./pricing.service.js";

export const getPricingStatus = async (req, res, next) => {
  try {
    const data = await pricingService.getStatus();
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getAllSeasonalPricing = async (req, res, next) => {
  try {
    const data = await pricingService.getAllSeasonalPricing(req.query);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getSeasonalPricingById = async (req, res, next) => {
  try {
    const data = await pricingService.getSeasonalPricingById(req.params.id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const createSeasonalPricing = async (req, res, next) => {
  try {
    const data = await pricingService.createSeasonalPricing(req.body);
    return sendSuccess(res, data, 201);
  } catch (error) {
    next(error);
  }
};

export const updateSeasonalPricing = async (req, res, next) => {
  try {
    const data = await pricingService.updateSeasonalPricing(req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const deleteSeasonalPricing = async (req, res, next) => {
  try {
    const data = await pricingService.deleteSeasonalPricing(req.params.id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getAllSpecificDatePricing = async (req, res, next) => {
  try {
    const data = await pricingService.getAllSpecificDatePricing(req.query);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getSpecificDatePricingById = async (req, res, next) => {
  try {
    const data = await pricingService.getSpecificDatePricingById(req.params.id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const createSpecificDatePricing = async (req, res, next) => {
  try {
    const data = await pricingService.createSpecificDatePricing(req.body);
    return sendSuccess(res, data, 201);
  } catch (error) {
    next(error);
  }
};

export const updateSpecificDatePricing = async (req, res, next) => {
  try {
    const data = await pricingService.updateSpecificDatePricing(req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const deleteSpecificDatePricing = async (req, res, next) => {
  try {
    const data = await pricingService.deleteSpecificDatePricing(req.params.id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
