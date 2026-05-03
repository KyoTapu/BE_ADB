// DTO formatter: only map data for API response.
// Replace fields below to match your module.
export const toHotelsResponse = (record = {}) => ({
  id: record.hotel_id,
  countryId: record.country_id,
  name: record.hotel_name,
  cityAddress: record.city_address,
  starRating: record.star_rating,
  description: record.description,
  timeZone: record.timezone,
  createdAt: record.created_at ?? null,
  updatedAt: record.updated_at ?? null,
  deletedAt: record.deleted_at ?? null,
});

export const toHotelsListResponse = (records = []) => records.map((record) => toHotelsResponse(record));
