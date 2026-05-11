import { createCrudRouter } from "../../common/crud.js";
import { amenitiesController } from "./amenities.controller.js";
import { amenitiesModel } from "./amenities.model.js";

export const amenitiesRoute = {
  moduleName: amenitiesModel.moduleName,
  routePath: amenitiesModel.routePath,
  router: createCrudRouter(amenitiesController),
};
