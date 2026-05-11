import { createCrudRouter } from "../../common/crud.js";
import { dailyRatesController } from "./daily-rates.controller.js";
import { dailyRatesModel } from "./daily-rates.model.js";

export const dailyRatesRoute = {
  moduleName: dailyRatesModel.moduleName,
  routePath: dailyRatesModel.routePath,
  router: createCrudRouter(dailyRatesController),
};
