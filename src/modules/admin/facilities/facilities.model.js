export const toFacilitiesResponse = (record = {}) => ({
  id: record.service_id,
  hotelId: record.hotel_id,
  name: record.service_name,
  price: record.service_price,
  pricingType: record.pricing_type,
});

export const toFacilitiesListResponse = (records = []) =>
  records.map((record) => toFacilitiesResponse(record));
