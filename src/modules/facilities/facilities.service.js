import { createCrudService } from "../../common/crud.js";
import { facilitiesModel } from "./facilities.model.js";
import { facilitiesRepository } from "./facilities.repository.js";

export const facilitiesService = createCrudService(facilitiesRepository, facilitiesModel);
