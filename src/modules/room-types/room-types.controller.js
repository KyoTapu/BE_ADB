import { createCrudController } from "../../common/crud.js";
import { roomTypesService } from "./room-types.service.js";

export const roomTypesController = createCrudController(roomTypesService);
