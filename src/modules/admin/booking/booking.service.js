import { adminBookingRepository } from "./booking.repository.js";
import { toAdminBookingResponse } from "./booking.model.js";

class AdminBookingService {
  
  ALLOWED_TRANSITIONS = {
    'Pending': ['Confirmed', 'Cancelled'],
    'Confirmed': ['Checked-in', 'Cancelled'],
    'Checked-in': ['Checked-out'],
    'Checked-out': [], 
    'Cancelled': []    
  };

  async changeStatus(adminPayload, bookingId, newStatus) {
    const { adminHotelId, role } = adminPayload; 

    // 1. Lấy thông tin booking hiện tại
    const booking = await adminBookingRepository.getBookingById(bookingId);
    if (!booking) throw new Error("Không tìm thấy đơn đặt phòng.");

    // 2. Kiểm tra quyền chi nhánh (Cross-Branch Validation)
    // Nếu là 'staff' thì chỉ được thao tác ở khách sạn của mình. 'admin' tổng thì được qua mặt.
    if (role === 'staff' && booking.hotel_id !== adminHotelId) {
      throw new Error("Bạn không có quyền thao tác trên booking của chi nhánh khác.");
    }

    // 3. Kiểm tra tính hợp lệ của Trạng thái (State Machine)
    const currentStatus = booking.status;
    if (!this.ALLOWED_TRANSITIONS[currentStatus].includes(newStatus)) {
      throw new Error(`Thao tác không hợp lệ: Không thể chuyển từ ${currentStatus} sang ${newStatus}.`);
    }

    // 4. Các kiểm tra nghiệp vụ đặc thù
    if (newStatus === 'Checked-in') {
      // Ví dụ: Lấy tổng tiền đã thanh toán từ bảng Payment
      const totalPaid = await adminBookingRepository.getTotalPaidAmount(bookingId);
      // Nếu chính sách yêu cầu trả trước 100%
      if (totalPaid < booking.total_amount) {
        throw new Error("Khách chưa thanh toán đủ tiền, không thể Check-in.");
      }
    }

    // 5. Thực hiện cập nhật
    const record = await adminBookingRepository.updateStatus(bookingId, newStatus);
    return toAdminBookingResponse(record);
  }
}

export const adminBookingService = new AdminBookingService();