import { createCrudService } from "../../common/crud.js";
import { roomsModel } from "./rooms.model.js";
import { roomsRepository } from "./rooms.repository.js";

export const roomsService = createCrudService(roomsRepository, roomsModel);
