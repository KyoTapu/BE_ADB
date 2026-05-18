import { createCrudRouter } from "../../common/crud.js";
import { hotelImagesController } from "./hotel-images.controller.js";
import { hotelImagesModel } from "./hotel-images.model.js";

export const hotelImagesRoute = {
  moduleName: hotelImagesModel.moduleName,
  routePath: hotelImagesModel.routePath,
  router: createCrudRouter(hotelImagesController),
};
