import { createCrudRouter } from "../../common/crud.js";
import { paymentsController } from "./payments.controller.js";
import { paymentsModel } from "./payments.model.js";

export const paymentsRoute = {
  moduleName: paymentsModel.moduleName,
  routePath: paymentsModel.routePath,
  router: createCrudRouter(paymentsController),
};
