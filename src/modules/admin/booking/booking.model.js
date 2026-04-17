// DTO formatter: only map data for API response.
// Replace fields below to match your module.
export const toAdminBookingResponse = (record = {}) => ({
  id: record.id,
  customerName: record.full_name,
  email: record.email,
  hotelName: record.hotel_name,
  checkIn: record.check_in,
  checkOut: record.check_out,
  totalAmount: parseFloat(record.total_amount),
  status: record.status,
  createdAt: record.created_at,
});

export const toAdminBookingListResponse = (records = []) =>
  records.map((record) => toAdminBookingResponse(record));