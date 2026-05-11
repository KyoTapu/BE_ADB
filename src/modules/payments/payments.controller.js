import { createCrudController } from "../../common/crud.js";
import { paymentsService } from "./payments.service.js";

export const paymentsController = createCrudController(paymentsService);
