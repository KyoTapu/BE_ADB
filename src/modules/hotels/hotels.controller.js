import { createCrudController } from "../../common/crud.js";
import { hotelsService } from "./hotels.service.js";

export const hotelsController = createCrudController(hotelsService);
