import { createCrudController } from "../../common/crud.js";
import { roomTypeImagesService } from "./room-type-images.service.js";

export const roomTypeImagesController = createCrudController(roomTypeImagesService);
