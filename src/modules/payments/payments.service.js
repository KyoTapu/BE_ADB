import { createCrudService } from "../../common/crud.js";
import { paymentsModel } from "./payments.model.js";
import { paymentsRepository } from "./payments.repository.js";

export const paymentsService = createCrudService(paymentsRepository, paymentsModel);
