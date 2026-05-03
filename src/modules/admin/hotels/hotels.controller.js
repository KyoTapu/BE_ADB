import { sendSuccess } from "../../../common/response.js";
import { hotelsService } from "./hotels.service.js";

export const getHotelsStatus = async (req, res, next) => {
  try {
    const data = await hotelsService.getStatus();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getAllHotels = async (req, res, next) => {
  try {
    const data = await hotelsService.getAllHotels(req.query);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getHotelById = async (req, res, next) => {
  try {
    const data = await hotelsService.getHotelById(req.params.id);
    console.log("🚀 ~ getHotelById ~ data:", data);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const createHotel = async (req, res, next) => {
  try {
    const body = req.body;
    const data = await hotelsService.createHotel(body);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const updateHotel = async (req, res, next) => {
  try {
    const id = req.params.id;
    const payload = req.body;
    const data = await hotelsService.updateHotel(id, payload);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const softDeleteHotel = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = await hotelsService.softDeleteHotel(id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const restoreHotel = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = await hotelsService.restoreHotel(id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
