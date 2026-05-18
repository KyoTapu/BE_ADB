import { createCrudRepository } from "../../common/crud.js";
import { roomTypeImagesModel } from "./room-type-images.model.js";

export const roomTypeImagesRepository = createCrudRepository(roomTypeImagesModel);
