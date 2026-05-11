import { createCrudController } from "../../common/crud.js";
import { facilitiesService } from "./facilities.service.js";

export const facilitiesController = createCrudController(facilitiesService);
