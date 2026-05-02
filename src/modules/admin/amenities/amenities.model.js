export const toAmenitiesResponse = (record = {}) => ({
  id: record.amenity_id,
  roomTypeId: record.room_type_id,
  name: record.amenity_name,
  description: record.amenity_description,
  created_at: record.created_at,
  updated_at: record.updated_at
});

export const toAmenitiesListResponse = (records = []) =>
  records.map((record) => toAmenitiesResponse(record));
