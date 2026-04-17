import { paymentService } from "./payment.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";

export const generatePayment = async (req, res, next) => {
  try {
    const { bookingId, amount, method } = req.body;

    
    const result = await paymentService.createPaymentUrl(bookingId, amount, method);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const paymentWebhook = async (req, res, next) => {
  try {
    const payload = req.query; 
    await paymentService.handleWebhook(payload, 'VNPay');
    
    res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (error) {
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};