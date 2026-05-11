import { createCrudRouter } from "../../common/crud.js";
import { roomsController } from "./rooms.controller.js";
import { roomsModel } from "./rooms.model.js";

export const roomsRoute = {
  moduleName: roomsModel.moduleName,
  routePath: roomsModel.routePath,
  router: createCrudRouter(roomsController),
};
