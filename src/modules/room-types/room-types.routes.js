import { createCrudRouter } from "../../common/crud.js";
import { roomTypesController } from "./room-types.controller.js";
import { roomTypesModel } from "./room-types.model.js";

export const roomTypesRoute = {
  moduleName: roomTypesModel.moduleName,
  routePath: roomTypesModel.routePath,
  router: createCrudRouter(roomTypesController),
};
