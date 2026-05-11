import { createCrudRouter } from "../../common/crud.js";
import { ratePlansController } from "./rate-plans.controller.js";
import { ratePlansModel } from "./rate-plans.model.js";

export const ratePlansRoute = {
  moduleName: ratePlansModel.moduleName,
  routePath: ratePlansModel.routePath,
  router: createCrudRouter(ratePlansController),
};
