export const toAmenitiesResponse = (record = {}) => ({
  id: record.amenity_id,
  roomTypeId: record.room_type_id,
  name: record.amenity_name,
});

export const toAmenitiesListResponse = (records = []) =>
  records.map((record) => toAmenitiesResponse(record));
