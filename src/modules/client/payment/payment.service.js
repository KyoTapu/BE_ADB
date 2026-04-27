import { paymentRepository } from "./payment.repository.js";
import { toPaymentResponse } from "./payment.model.js";

class PaymentService {
  // Bước 1: Khởi tạo thanh toán và tạo URL
  async createPaymentUrl(bookingId, amount, method) {
    // 1. Lưu DB trạng thái Pending
    const paymentData = {
      booking_id: bookingId,
      amount: amount,
      payment_method: method // 'VNPay', 'Momo', 'Stripe'
    };
    const payment = await paymentRepository.createPayment(paymentData);

    // 2. Tạo URL gửi cho bên thứ 3 (Mock logic)
    let paymentUrl = "";
    if (method === 'VNPay') {
      // TODO: Dùng VNPay SDK tạo chuỗi mã hóa và URL
      paymentUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txnRef=${payment.id}&amount=${amount}`;
    } else if (method === 'Momo') {
      // TODO: Dùng Momo API
      paymentUrl = `https://test-payment.momo.vn/pay?id=${payment.id}`;
    }

    return {
      paymentId: payment.id,
      url: paymentUrl
    };
  }

  // Bước 2: Nhận thông báo ngầm (Webhook/IPN) từ Momo/VNPay
  async handleWebhook(payload, method) {
    // TODO: Verify chữ ký số (Signature) để đảm bảo request đúng là của Momo/VNPay gửi tới.
    const isValidSignature = true; // Chỗ này phải code logic mã hóa HMAC SHA256
    
    if (!isValidSignature) {
      throw new Error("Invalid Payment Signature");
    }

    const paymentId = payload.vnp_TxnRef; 
    const bookingId = payload.vnp_OrderInfo; 
    const responseCode = payload.vnp_ResponseCode; 

    if (responseCode === '00') { 
      return await paymentRepository.markPaymentSuccess(paymentId, bookingId);
    } else {
      return await paymentRepository.updatePaymentStatusOnly(paymentId, 'Failed');
    }
  }
}

export const paymentService = new PaymentService();