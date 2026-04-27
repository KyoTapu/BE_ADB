// DTO formatter: only map data for API response.
// Replace fields below to match your module.
export const toAmenitiesResponse = (record = {}) => ({
  amenity_id: record.amenity_id,
  amenity_name: record.amenity_name,
  amenity_description: record.amenity_description,
  icon: record.icon,
  created_at: record.created_at,
  updated_at: record.updated_at,
  deleted_at: record.deleted_at,
});

export const toAmenitiesListResponse = (records = []) =>
  records.map((record) => toAmenitiesResponse(record));
