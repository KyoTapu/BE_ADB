import { createCrudService } from "../../common/crud.js";
import { ratePlansModel } from "./rate-plans.model.js";
import { ratePlansRepository } from "./rate-plans.repository.js";

export const ratePlansService = createCrudService(ratePlansRepository, ratePlansModel);
