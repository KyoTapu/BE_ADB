// DTO formatter: only map data for API response.
// Replace fields below to match your module.
export const toHotelservicesResponse = (record = {}) => ({
  id: record.id,
  name: record.name,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const toHotelservicesListResponse = (records = []) =>
  records.map((record) => toHotelservicesResponse(record));
