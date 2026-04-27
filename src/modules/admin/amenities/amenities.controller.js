import { sendSuccess } from "../../../common/response.js";
import { amenitiesService } from "./amenities.service.js";

export const getAmenitiesStatus = async (req, res, next) => {
  try {
    const data = await amenitiesService.getStatus();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getAllAmenities = async (req, res, next) => {
  try {
    const data = await amenitiesService.getAllAmenities(req.query);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getAmenityById = async (req, res, next) => {
  try {
    const data = await amenitiesService.getAmenityById(req.params.id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const createAmenity = async (req, res, next) => {
  try {
    const data = await amenitiesService.createAmenity(req.body);
    return sendSuccess(res, data, 201);
  } catch (error) {
    next(error);
  }
};

export const updateAmenity = async (req, res, next) => {
  try {
    const data = await amenitiesService.updateAmenity(req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const deleteAmenity = async (req, res, next) => {
  try {
    const data = await amenitiesService.deleteAmenity(req.params.id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
