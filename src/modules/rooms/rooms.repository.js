import { createCrudRepository } from "../../common/crud.js";
import { roomsModel } from "./rooms.model.js";

export const roomsRepository = createCrudRepository(roomsModel);
