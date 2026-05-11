import { sendSuccess } from "../../common/response.js";
import { searchService } from "./search.service.js";

export const searchController = {
  async search(req, res, next) {
    try {
      return sendSuccess(res, await searchService.search(req.query));
    } catch (error) {
      return next(error);
    }
  },
};
