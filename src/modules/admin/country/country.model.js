// DTO formatter: only map data for API response.
// Replace fields below to match your module.
export const toCountryResponse = (record = {}) => ({
  country_id: record.country_id,
  country_code: record.country_code,
  country_name: record.country_name,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const toCountryListResponse = (records = []) =>
  records.map((record) => toCountryResponse(record));
