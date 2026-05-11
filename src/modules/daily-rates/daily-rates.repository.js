import { createCrudRepository } from "../../common/crud.js";
import { dailyRatesModel } from "./daily-rates.model.js";

export const dailyRatesRepository = createCrudRepository(dailyRatesModel);
