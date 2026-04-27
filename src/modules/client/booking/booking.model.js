// DTO formatter: only map data for API response.
// Replace fields below to match your module.
export const toBookingResponse = (record = {}) => ({
  id: record.id,
  userId: record.user_id,
  checkIn: record.check_in,
  checkOut: record.check_out,
  totalAmount: record.total_amount,
  status: record.status,
  details: record.details ? record.details.map(toBookingDetailResponse) : [],
  createdAt: record.created_at,
});

export const toBookingDetailResponse = (detail = {}) => ({
  roomId: detail.room_id,
  priceAtBooking: detail.price_at_booking,
  countChild: detail.count_child,
  countParent: detail.count_parent,
});