import { createCrudService } from "../../common/crud.js";
import { dailyInventoryModel } from "./daily-inventory.model.js";
import { dailyInventoryRepository } from "./daily-inventory.repository.js";

export const dailyInventoryService = createCrudService(dailyInventoryRepository, dailyInventoryModel);
