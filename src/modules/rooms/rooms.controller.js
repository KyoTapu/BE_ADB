import { createCrudController } from "../../common/crud.js";
import { roomsService } from "./rooms.service.js";

export const roomsController = createCrudController(roomsService);
