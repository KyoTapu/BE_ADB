/* =========================
   ROOM TYPE
========================= */

export const toRoomTypeResponse = (record = {}) => ({
  roomTypeId: record.room_type_id,
  hotelId: record.hotel_id,
  name: record.room_type_name,
  basePrice: record.room_type_base_price,
  services: record.room_type_services || null,
  servicesText: record.room_type_services || "",
  facilities: Array.isArray(record.facilities)
    ? record.facilities.map((facility) => ({
        id: facility.service_id,
        hotelId: facility.hotel_id,
        name: facility.facility_name,
        price: facility.facility_price,
        pricingType: facility.pricing_type,
        createdAt: facility.created_at ?? null,
        updatedAt: facility.updated_at ?? null,
      }))
    : [],
  facilityIds: Array.isArray(record.facilities)
    ? record.facilities.map((facility) => facility.service_id)
    : [],
  amenities: Array.isArray(record.amenities)
    ? record.amenities.map((amenity) => ({
        id: amenity.amenity_id,
        roomTypeId: amenity.room_type_id,
        name: amenity.amenity_name,
        description: amenity.amenity_description || "",
        createdAt: amenity.created_at ?? null,
        updatedAt: amenity.updated_at ?? null,
      }))
    : [],
  amenityNames: Array.isArray(record.amenities)
    ? record.amenities.map((amenity) => amenity.amenity_name)
    : [],
  createdAt: record.created_at ?? null,
  updatedAt: record.updated_at ?? null,
});

export const toRoomTypeListResponse = (records = []) => records.map((r) => toRoomTypeResponse(r));

/* =========================
   ROOM
========================= */

export const toRoomResponse = (record = {}) => ({
  roomId: record.room_id,
  roomTypeId: record.room_type_id,
  name: record.name,
  floor: record.floor,
  number: record.number,
  capacity: record.capacity,
  isAvailable: Boolean(record.is_available),
  status: record.status,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const toRoomListResponse = (records = []) => records.map((r) => toRoomResponse(r));

/* =========================
   ROOM DETAIL (JOIN)
========================= */

export const toRoomDetailResponse = (record = {}) => ({
  roomId: record.room_id,
  name: record.name,
  floor: record.floor,
  number: record.number,
  capacity: record.capacity,
  isAvailable: Boolean(record.is_available),
  status: record.status,

  roomType: {
    roomTypeId: record.room_type_id,
    name: record.room_type_name,
    basePrice: record.room_type_base_price,
    services: record.room_type_services || null,
  },

  createdAt: record.created_at,
  updatedAt: record.updated_at,
});
