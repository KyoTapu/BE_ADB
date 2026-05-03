import { sendSuccess } from "../../../common/response.js";
import { countryService } from "./country.service.js";

export const getCountryStatus = async (req, res, next) => {
  try {
    const data = await countryService.getStatus();
    res.json(data);
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
