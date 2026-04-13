import { paymentService } from "./payment.service.js";

export const getPaymentStatus = async (req, res, next) => {
  try {
    const data = await paymentService.getStatus();
    res.json(data);
  } catch (error) {
    next(error);
  }
};
