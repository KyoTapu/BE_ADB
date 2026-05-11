import { createCrudRepository } from "../../common/crud.js";
import { ratePlansModel } from "./rate-plans.model.js";

export const ratePlansRepository = createCrudRepository(ratePlansModel);
