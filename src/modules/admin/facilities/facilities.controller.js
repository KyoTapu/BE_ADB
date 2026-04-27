import { sendSuccess } from "../../../common/response.js";
import { facilitiesService } from "./facilities.service.js";

export const getFacilitiesStatus = async (req, res, next) => {
  try {
    const data = await facilitiesService.getStatus();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getAllFacilities = async (req, res, next) => {
  try {
    const data = await facilitiesService.getAllFacilities(req.query);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getFacilityById = async (req, res, next) => {
  try {
    const data = await facilitiesService.getFacilityById(req.params.id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const createFacility = async (req, res, next) => {
  try {
    const data = await facilitiesService.createFacility(req.body);
    return sendSuccess(res, data, 201);
  } catch (error) {
    next(error);
  }
};

export const updateFacility = async (req, res, next) => {
  try {
    const data = await facilitiesService.updateFacility(req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const deleteFacility = async (req, res, next) => {
  try {
    const data = await facilitiesService.deleteFacility(req.params.id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
