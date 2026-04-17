import crypto from "crypto";
import moment from "moment";
import { paymentRepository } from "./payment.repository.js";

class PaymentService {
  // --- TÍCH HỢP VNPAY ---
  async createVNPayUrl(bookingId, amount, ipAddr) {
    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");
    
    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    // Tạo bản ghi Payment với trạng thái Pending
    const payment = await paymentRepository.createPayment({
      booking_id: bookingId,
      amount: amount,
      payment_method: "VNPay"
    });

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: payment.id.toString(), // Dùng ID của bảng Payment làm mã tham chiếu
      vnp_OrderInfo: `Thanh toan booking #${bookingId}`,
      vnp_OrderType: "other",
      vnp_Amount: amount * 100, // VNPay tính theo đơn vị đồng * 100
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    // Sắp xếp các tham số theo alphabet (bắt buộc)
    vnp_Params = this._sortObject(vnp_Params);

    const signData = new URLSearchParams(vnp_Params).toString();
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    
    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + new URLSearchParams(vnp_Params).toString();

    return vnpUrl;
  }

  // --- TÍCH HỢP MOMO ---
  async createMomoUrl(bookingId, amount) {
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const orderInfo = `Thanh toan booking #${bookingId}`;
    const redirectUrl = "http://localhost:3000/payment/success";
    const ipnUrl = "http://localhost:3000/api/v1/payment/momo-ipn";
    const requestId = partnerCode + new Date().getTime();
    const orderId = requestId; // Định danh đơn hàng
    const extraData = ""; 

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`;

    const signature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

    const requestBody = {
      partnerCode, accessKey, requestId, amount, orderId, orderInfo,
      redirectUrl, ipnUrl, extraData, requestType: "captureWallet", signature, lang: "vi",
    };

    // Gửi request tới Momo để lấy link thanh toán
    const response = await fetch(process.env.MOMO_API_URL, {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    });
    
    const result = await response.json();
    return result.payUrl;
  }

  _sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
  }
}

export const paymentService = new PaymentService();