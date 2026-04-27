import { adminPaymentRepository } from "./payment.repository.js";
import { bookingRepository } from "../../client/booking/booking.repository.js"; // Gọi chéo logic kiểm tra booking
import { toAdminPaymentListResponse, toAdminPaymentResponse } from "./payment.model.js";

class AdminPaymentService {
  async getTransactions(adminPayload, filters) {
    const { adminHotelId, role } = adminPayload;
    
    // RÀNG BUỘC CHI NHÁNH: Staff chỉ thấy tiền của khách sạn mình
    if (role === 'staff') {
      filters.hotelId = adminHotelId;
    }

    const records = await adminPaymentRepository.getAllPayments(filters);
    return toAdminPaymentListResponse(records);
  }

  async recordManualPayment(adminPayload, payload) {
    const { bookingId, amount, method } = payload;
    const { adminHotelId, role } = adminPayload;

    // 1. KIỂM TRA BOOKING: Đơn hàng có tồn tại không?
    const booking = await bookingRepository.getBookingById(bookingId);
    if (!booking) throw new Error("Mã đơn hàng không tồn tại.");

    // 2. KIỂM TRA PHÂN QUYỀN: Staff có đang thu tiền đúng chi nhánh không?
    if (role === 'staff' && booking.hotel_id !== adminHotelId) {
      throw new Error("Bạn không thể thu tiền cho đơn hàng của chi nhánh khác.");
    }

    // 3. KIỂM TRA SỐ TIỀN: Số tiền thu tại quầy phải khớp với tổng bill
    // (Hoặc cho phép thu cọc nhưng cần logic quản lý công nợ phức tạp hơn)
    if (parseFloat(amount) !== parseFloat(booking.total_amount)) {
      throw new Error(`Số tiền thu (${amount}) không khớp với tổng bill (${booking.total_amount}).`);
    }

    // 4. KIỂM TRA TRẠNG THÁI: Đơn đã hủy thì không được thu tiền
    if (booking.status === 'Cancelled' || booking.status === 'Rejected') {
      throw new Error("Không thể thu tiền cho đơn hàng đã bị hủy.");
    }

    const record = await adminPaymentRepository.createManualPayment({
      booking_id: bookingId,
      amount,
      payment_method: method
    });

    return toAdminPaymentResponse(record);
  }
}

export const adminPaymentService = new AdminPaymentService();