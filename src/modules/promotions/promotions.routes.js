import { createCrudRouter } from "../../common/crud.js";
import { promotionsController } from "./promotions.controller.js";
import { promotionsModel } from "./promotions.model.js";

export const promotionsRoute = {
  moduleName: promotionsModel.moduleName,
  routePath: promotionsModel.routePath,
  router: createCrudRouter(promotionsController),
};
