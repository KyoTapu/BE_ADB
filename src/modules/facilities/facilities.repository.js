import { createCrudRepository } from "../../common/crud.js";
import { facilitiesModel } from "./facilities.model.js";

export const facilitiesRepository = createCrudRepository(facilitiesModel);
