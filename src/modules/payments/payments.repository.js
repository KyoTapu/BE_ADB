import { createCrudRepository } from "../../common/crud.js";
import { paymentsModel } from "./payments.model.js";

export const paymentsRepository = createCrudRepository(paymentsModel);
