import { createCrudService } from "../../common/crud.js";
import { hotelImagesModel } from "./hotel-images.model.js";
import { hotelImagesRepository } from "./hotel-images.repository.js";

export const hotelImagesService = createCrudService(hotelImagesRepository, hotelImagesModel);
