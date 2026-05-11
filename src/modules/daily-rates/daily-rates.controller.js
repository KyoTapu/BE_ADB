import { createCrudController } from "../../common/crud.js";
import { dailyRatesService } from "./daily-rates.service.js";

export const dailyRatesController = createCrudController(dailyRatesService);
