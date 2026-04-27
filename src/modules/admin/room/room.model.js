/* =========================
   ROOM TYPE
========================= */

export const toRoomTypeResponse = (record = {}) => ({
  roomTypeId: record.room_type_id,
  hotelId: record.hotel_id,
  name: record.room_type_name,
  basePrice: record.room_type_base_price,
  services: record.room_type_services || null,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
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
