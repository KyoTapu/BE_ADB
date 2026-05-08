import { sendSuccess } from "../../../common/response.js";
import { searchService } from "../../client/search/search.service.js";

export const getSearchIndexStatus = async (req, res, next) => {
  try {
    const data = await searchService.getIndexStatus();
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const rebuildSearchIndex = async (req, res, next) => {
  try {
    const horizonDays = Number(req.body?.horizonDays ?? req.query?.horizonDays) || 180;
    const data = await searchService.rebuildIndex({ horizonDays });
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const testSearchIndexQuery = async (req, res, next) => {
  try {
    const data = await searchService.testQuery(req.body || {});
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
