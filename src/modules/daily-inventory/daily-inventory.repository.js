import { createCrudRepository } from "../../common/crud.js";
import { dailyInventoryModel } from "./daily-inventory.model.js";

export const dailyInventoryRepository = createCrudRepository(dailyInventoryModel);
