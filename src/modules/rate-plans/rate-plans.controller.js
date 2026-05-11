import { createCrudController } from "../../common/crud.js";
import { ratePlansService } from "./rate-plans.service.js";

export const ratePlansController = createCrudController(ratePlansService);
