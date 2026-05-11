import { createCrudService } from "../../common/crud.js";
import { promotionsModel } from "./promotions.model.js";
import { promotionsRepository } from "./promotions.repository.js";

export const promotionsService = createCrudService(promotionsRepository, promotionsModel);
