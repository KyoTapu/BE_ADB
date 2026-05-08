import { sendSuccess } from "../../../common/response.js";
import { countryService } from "./country.service.js";

export const getCountryStatus = async (req, res, next) => {
  try {
    const data = await countryService.getStatus();
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getAllCountries = async (req, res, next) => {
  try {
    const data = await countryService.getAllCountries(req.query);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getCountryById = async (req, res, next) => {
  try {
    const data = await countryService.getCountryById(req.params.id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const createCountry = async (req, res, next) => {
  try {
    const data = await countryService.createCountry(req.body);
    return sendSuccess(res, data, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCountry = async (req, res, next) => {
  try {
    const data = await countryService.updateCountry(req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const deleteCountry = async (req, res, next) => {
  try {
    const data = await countryService.deleteCountry(req.params.id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
