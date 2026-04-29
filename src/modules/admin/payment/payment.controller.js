import { adminPaymentService } from "./payment.service.js";
import { sendSuccess } from "../../../common/response.js";

export const getHistory = async (req, res, next) => {
  try {
    const data = await adminPaymentService.getTransactions(req.user, req.query);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const createManual = async (req, res, next) => {
  try {
    const data = await adminPaymentService.recordManualPayment(req.user, req.body);
    sendSuccess(res, data, 201);
  } catch (error) {
    next(error);
  }
};
