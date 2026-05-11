import { createCrudRouter } from "../../common/crud.js";
import { facilitiesController } from "./facilities.controller.js";
import { facilitiesModel } from "./facilities.model.js";

export const facilitiesRoute = {
  moduleName: facilitiesModel.moduleName,
  routePath: facilitiesModel.routePath,
  router: createCrudRouter(facilitiesController),
};
