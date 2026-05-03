const toServiceResponse = (service = {}) => ({
  id: service.service_id,
  name: service.service_name,
  price: Number(service.service_price) || 0,
  pricingType: service.pricing_type || "per_use",
});

export const toRoomTypeResponse = (record = {}) => ({
  roomTypeId: record.room_type_id,
  hotelId: record.hotel_id,
  name: record.room_type_name,
  basePrice: Number(record.room_type_base_price) || 0,
  servicesText: record.room_type_services || "",
  amenities: Array.isArray(record.amenities)
    ? record.amenities.map((amenity) => amenity.amenity_name)
    : [],
  services: Array.isArray(record.services) ? record.services.map((service) => toServiceResponse(service)) : [],
  availableRoomCount: Number(record.availableRoomCount) || 0,
  totalRoomCount: Number(record.totalRoomCount) || 0,
  maxCapacity: Number(record.maxCapacity) || 0,
  nightlyRates: Array.isArray(record.nightlyRates)
    ? record.nightlyRates.map((night) => ({
        date: night.date,
        rate: Number(night.rate) || 0,
        source: night.source,
      }))
    : [],
  averageNightlyRate: Number(record.averageNightlyRate) || 0,
  stayTotal: Number(record.stayTotal) || 0,
});

export const toHotelSummaryResponse = (record = {}) => ({
  id: record.hotel_id,
  countryId: record.country_id,
  countryName: record.country_name || "",
  countryCode: record.country_code || "",
  name: record.hotel_name,
  cityAddress: record.city_address || "",
  starRating: Number(record.star_rating) || 0,
  description: record.description || "",
  timezone: record.timezone || "UTC",
  priceFrom: Number(record.priceFrom) || 0,
  stayTotalFrom: Number(record.stayTotalFrom) || 0,
  matchedRoomTypes: Array.isArray(record.matchedRoomTypes)
    ? record.matchedRoomTypes.map((roomType) => toRoomTypeResponse(roomType))
    : [],
});

export const toHotelSummaryListResponse = (records = []) =>
  records.map((record) => toHotelSummaryResponse(record));

export const toHotelDetailResponse = (record = {}) => ({
  id: record.hotel_id,
  countryId: record.country_id,
  countryName: record.country_name || "",
  countryCode: record.country_code || "",
  name: record.hotel_name,
  cityAddress: record.city_address || "",
  starRating: Number(record.star_rating) || 0,
  description: record.description || "",
  timezone: record.timezone || "UTC",
  roomTypes: Array.isArray(record.roomTypes)
    ? record.roomTypes.map((roomType) => toRoomTypeResponse(roomType))
    : [],
  hotelServices: Array.isArray(record.hotelServices)
    ? record.hotelServices.map((service) => toServiceResponse(service))
    : [],
  updatedAt: record.updated_at ?? null,
});
