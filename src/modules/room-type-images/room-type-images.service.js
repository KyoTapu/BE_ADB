import { createCrudService } from "../../common/crud.js";
import { roomTypeImagesModel } from "./room-type-images.model.js";
import { roomTypeImagesRepository } from "./room-type-images.repository.js";

export const roomTypeImagesService = createCrudService(roomTypeImagesRepository, roomTypeImagesModel);
