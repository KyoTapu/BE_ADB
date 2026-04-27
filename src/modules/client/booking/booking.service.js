import { bookingRepository } from "./booking.repository.js";
import { toBookingResponse } from "./booking.model.js";
// Service giả lập -> sau thay bằng Redis 
// import { pricingService } from "../pricing/pricing.service.js"; 

class BookingService {
  async createBooking(userId, payload) {
    const { checkIn, checkOut, rooms } = payload;
    
    let totalAmount = 0;
    const details = [];

    //Lấy mảng các ngày lưu trú 
    const dates = this._generateDateRange(checkIn, checkOut);
    if (dates.length === 0) throw new Error("Check-out date must be after check-in date");

    for (const item of rooms) {
      const isAvailable = await bookingRepository.checkRoomAvailability(item.roomId, checkIn, checkOut);
      if (!isAvailable) {
        throw new Error(`Phòng ${item.roomId} không còn trống trong khoảng thời gian này.`);
      }

      // 1. Tính giá phòng cho mỗi ngày (giả sử có thể thay bằng pricingService.getPrice(roomId, date))
      let roomTotalPrice = 0;
      for (const date of dates) {
        const dailyPrice = 1000000; 
        roomTotalPrice += dailyPrice;
      }
      //

      totalAmount += roomTotalPrice;

      // Lưu giá phòng để tránh trường hợp giá thay đổi sau khi đặt phòng
      details.push({
        room_id: item.roomId,
        price_at_booking: roomTotalPrice, 
        count_child: item.countChild || 0,
        count_parent: item.countParent || 1
      });
    }

    const bookingData = {
      user_id: userId,
      check_in: checkIn,
      check_out: checkOut,
      total_amount: totalAmount,
      status: 'Pending'
    };

    const record = await bookingRepository.createWithDetails(bookingData, details);
    return toBookingResponse(record);
  }

  async processCheckInOut(id, status) {
    const record = await bookingRepository.updateStatus(id, status);
    return toBookingResponse(record);
  }

  _generateDateRange(start, end) {
    const dates = [];
    let current = new Date(start);
    const last = new Date(end);
    while (current < last) {
      dates.push(new Date(current).toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }
}

export const bookingService = new BookingService();