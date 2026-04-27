// DTO formatter: only map data for API response.
// Replace fields below to match your module.
export const toPaymentResponse = (record = {}) => ({
  id: record.id,
  bookingId: record.booking_id,
  amount: parseFloat(record.amount),
  method: record.payment_method,
  status: record.status,
  paidAt: record.paid_at
});

export const toPaymentListResponse = (records = []) =>
  records.map((record) => toPaymentResponse(record));