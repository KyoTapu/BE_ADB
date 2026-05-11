import { createCrudService } from "../../common/crud.js";
import { amenitiesModel } from "./amenities.model.js";
import { amenitiesRepository } from "./amenities.repository.js";

export const amenitiesService = createCrudService(amenitiesRepository, amenitiesModel);
