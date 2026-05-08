export const toAmenitiesResponse = (record = {}) => ({
  id: record.amenity_id,
  hotelId: record.hotel_id,
  name: record.amenity_name,
  description: record.amenity_description,
  createdAt: record.created_at ?? null,
  updatedAt: record.updated_at ?? null,
});

export const toAmenitiesListResponse = (records = []) =>
  records.map((record) => toAmenitiesResponse(record));
