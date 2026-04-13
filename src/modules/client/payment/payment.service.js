import { paymentRepository } from "./payment.repository.js";
import { toPaymentResponse } from "./payment.model.js";

class PaymentService {
  async getStatus() {
    const record = await paymentRepository.getStatus();
    return toPaymentResponse(record);
  }
}

export const paymentService = new PaymentService();
