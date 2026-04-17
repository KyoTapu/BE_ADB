// DTO formatter: only map data for API response.
// Replace fields below to match your module.
export const toAdminPaymentResponse = (record = {}) => ({
  id: record.id,
  bookingId: record.booking_id,
  customerName: record.full_name,
  hotelName: record.hotel_name,
  amount: parseFloat(record.amount),
  method: record.payment_method, // 'Cash', 'VNPay', 'Momo', 'POS'
  status: record.status, // 'Pending', 'Success', 'Failed', 'Refunded'
  paidAt: record.paid_at,
  transactionId: record.transaction_id || 'N/A' // Mã giao dịch từ cổng thanh toán
});

export const toAdminPaymentListResponse = (records = []) =>
  records.map((record) => toAdminPaymentResponse(record));