import { createCrudRepository } from "../../common/crud.js";
import { hotelImagesModel } from "./hotel-images.model.js";

export const hotelImagesRepository = createCrudRepository(hotelImagesModel);
