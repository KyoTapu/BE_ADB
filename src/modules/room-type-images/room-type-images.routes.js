import { createCrudRouter } from "../../common/crud.js";
import { roomTypeImagesController } from "./room-type-images.controller.js";
import { roomTypeImagesModel } from "./room-type-images.model.js";

export const roomTypeImagesRoute = {
  moduleName: roomTypeImagesModel.moduleName,
  routePath: roomTypeImagesModel.routePath,
  router: createCrudRouter(roomTypeImagesController),
};
