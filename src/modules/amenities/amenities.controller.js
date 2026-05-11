import { createCrudController } from "../../common/crud.js";
import { amenitiesService } from "./amenities.service.js";

export const amenitiesController = createCrudController(amenitiesService);
