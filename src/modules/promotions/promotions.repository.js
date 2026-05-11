import { createCrudRepository } from "../../common/crud.js";
import { promotionsModel } from "./promotions.model.js";

export const promotionsRepository = createCrudRepository(promotionsModel);
