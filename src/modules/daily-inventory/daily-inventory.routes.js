import { createCrudRouter } from "../../common/crud.js";
import { dailyInventoryController } from "./daily-inventory.controller.js";
import { dailyInventoryModel } from "./daily-inventory.model.js";

export const dailyInventoryRoute = {
  moduleName: dailyInventoryModel.moduleName,
  routePath: dailyInventoryModel.routePath,
  router: createCrudRouter(dailyInventoryController),
};
