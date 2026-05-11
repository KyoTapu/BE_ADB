import { createCrudRepository } from "../../common/crud.js";
import { hotelsModel } from "./hotels.model.js";

export const hotelsRepository = createCrudRepository(hotelsModel);
