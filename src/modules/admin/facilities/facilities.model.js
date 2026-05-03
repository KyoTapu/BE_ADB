export const toFacilitiesResponse = (record = {}) => ({
  id: record.service_id,
  hotelId: record.hotel_id,
  name: record.facility_name,
  price: record.facility_price,
  pricingType: record.pricing_type,
  createdAt: record.created_at ?? null,
  updatedAt: record.updated_at ?? null,
});

export const toFacilitiesListResponse = (records = []) =>
  records.map((record) => toFacilitiesResponse(record));
