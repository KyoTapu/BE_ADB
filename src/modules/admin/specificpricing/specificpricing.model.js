// DTO formatter: only map data for API response.
// Replace fields below to match your module.
export const toSpecificpricingResponse = (record = {}) => ({
  id: record.id,
  room_type_id: record.room_type_id,
  specific_date: record.specific_date,
  specific_rate: record.specific_rate,
  specific_note: record.specific_note,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const toSpecificpricingListResponse = (records = []) =>
  records.map((record) => toSpecificpricingResponse(record));
