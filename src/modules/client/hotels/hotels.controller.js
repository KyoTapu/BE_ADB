import { sendSuccess } from "../../../common/response.js";
import { clientHotelsService } from "./hotels.service.js";

export const getHotelsStatus = async (req, res, next) => {
  try {
    return sendSuccess(res, { status: "ok" });
  } catch (error) {
    next(error);
  }
};

export const getAllHotels = async (req, res, next) => {
  try {
    const data = await clientHotelsService.getHotelsForSearch(req.query);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getHotelById = async (req, res, next) => {
  try {
    const data = await clientHotelsService.getHotelDetail(req.params.id, req.query);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
