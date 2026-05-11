import { createCrudController } from "../../common/crud.js";
import { dailyInventoryService } from "./daily-inventory.service.js";

export const dailyInventoryController = createCrudController(dailyInventoryService);
