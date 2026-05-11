import { createCrudController } from "../../common/crud.js";
import { promotionsService } from "./promotions.service.js";

export const promotionsController = createCrudController(promotionsService);
