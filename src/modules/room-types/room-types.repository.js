import { createCrudRepository } from "../../common/crud.js";
import { roomTypesModel } from "./room-types.model.js";

export const roomTypesRepository = createCrudRepository(roomTypesModel);
