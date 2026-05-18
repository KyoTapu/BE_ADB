import { createCrudController } from "../../common/crud.js";
import { hotelImagesService } from "./hotel-images.service.js";

export const hotelImagesController = createCrudController(hotelImagesService);
