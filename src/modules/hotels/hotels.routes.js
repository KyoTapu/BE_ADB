import { createCrudRouter } from "../../common/crud.js";
import { hotelsController } from "./hotels.controller.js";
import { hotelsModel } from "./hotels.model.js";

export const hotelsRoute = {
  moduleName: hotelsModel.moduleName,
  routePath: hotelsModel.routePath,
  router: createCrudRouter(hotelsController),
};
