import { createCrudRepository } from "../../common/crud.js";
import { amenitiesModel } from "./amenities.model.js";

export const amenitiesRepository = createCrudRepository(amenitiesModel);
