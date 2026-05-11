import { createCrudService } from "../../common/crud.js";
import { hotelsModel } from "./hotels.model.js";
import { hotelsRepository } from "./hotels.repository.js";

export const hotelsService = createCrudService(hotelsRepository, hotelsModel);
