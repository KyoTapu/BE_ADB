export const toSeasonalPricingResponse = (record = {}) => ({
  id: record.season_id,
  hotelId: record.hotel_id,
  hotelName: record.hotel_name ?? null,
  startDate: record.start_date,
  endDate: record.end_date,
  multiplier: record.multiplier,
  updatedAt: record.updated_at ?? null,
});

export const toSeasonalPricingListResponse = (records = []) =>
  records.map((record) => toSeasonalPricingResponse(record));

export const toSpecificDatePricingResponse = (record = {}) => ({
  id: record.id,
  roomTypeId: record.room_type_id,
  roomTypeName: record.room_type_name ?? null,
  hotelId: record.hotel_id ?? null,
  hotelName: record.hotel_name ?? null,
  specificDate: record.specific_date,
  specificRate: record.specific_rate,
  specificNote: record.specific_note ?? null,
});

export const toSpecificDatePricingListResponse = (records = []) =>
  records.map((record) => toSpecificDatePricingResponse(record));
