import { createCrudService } from "../../common/crud.js";
import { dailyRatesModel } from "./daily-rates.model.js";
import { dailyRatesRepository } from "./daily-rates.repository.js";

export const dailyRatesService = createCrudService(dailyRatesRepository, dailyRatesModel);
