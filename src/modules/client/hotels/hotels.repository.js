import { pool } from "../../../../config/db.config.js";

class ClientHotelsRepository {
  async getHotels({ search, hotelId } = {}) {
    const values = [];
    let index = 1;
    let query = `
      SELECT
        h.hotel_id,
        h.country_id,
        c.country_name,
        c.country_code,
        h.hotel_name,
        h.city_address,
        h.star_rating,
        h.description,
        h.timezone,
        h.updated_at
      FROM hotels h
      LEFT JOIN country c ON c.country_id = h.country_id
      WHERE 1 = 1
    `;

    if (hotelId) {
      query += ` AND h.hotel_id = $${index}`;
      values.push(hotelId);
      index++;
    }

    if (search) {
      query += ` AND (h.hotel_name ILIKE $${index} OR h.city_address ILIKE $${index})`;
      values.push(`%${String(search).trim()}%`);
      index++;
    }

    query += " ORDER BY h.hotel_name ASC";

    const { rows } = await pool.query(query, values);
    return rows;
  }

  async getRoomTypesByHotelIds(hotelIds = []) {
    if (!hotelIds.length) return [];

    const query = `
      SELECT
        rt.room_type_id,
        rt.hotel_id,
        rt.room_type_name,
        rt.room_type_base_price,
        rt.room_type_services
      FROM room_type rt
      WHERE rt.hotel_id = ANY($1::int[])
      ORDER BY rt.room_type_base_price ASC, rt.room_type_id ASC
    `;

    const { rows } = await pool.query(query, [hotelIds]);
    return rows;
  }

  async getAmenitiesByRoomTypeIds(roomTypeIds = []) {
    if (!roomTypeIds.length) return [];

    const query = `
      SELECT
        amenity_id,
        room_type_id,
        amenity_name
      FROM amenities
      WHERE room_type_id = ANY($1::int[])
      ORDER BY amenity_name ASC
    `;

    const { rows } = await pool.query(query, [roomTypeIds]);
    return rows;
  }

  async getServicesByRoomTypeIds(roomTypeIds = []) {
    if (!roomTypeIds.length) return [];

    const query = `
      SELECT
        rts.room_type_id,
        s.service_id,
        s.hotel_id,
        s.facility_name AS service_name,
        s.facility_price AS service_price,
        s.pricing_type
      FROM room_type_service rts
      JOIN facilities s ON s.service_id = rts.facilities_id
      WHERE rts.room_type_id = ANY($1::int[])
      ORDER BY s.facility_name ASC
    `;

    const { rows } = await pool.query(query, [roomTypeIds]);
    return rows;
  }

  async getSeasonalPricingByHotelIds(hotelIds = []) {
    if (!hotelIds.length) return [];

    const query = `
      SELECT
        season_id,
        hotel_id,
        start_date,
        end_date,
        multiplier
      FROM seasonalpricing
      WHERE hotel_id = ANY($1::int[])
    `;

    const { rows } = await pool.query(query, [hotelIds]);
    return rows;
  }

  async getSpecialDatePricingByRoomTypeIds(roomTypeIds = []) {
    if (!roomTypeIds.length) return [];

    const query = `
      SELECT
        id,
        room_type_id,
        specific_date,
        specific_rate,
        specific_note
      FROM specialdatepricing
      WHERE room_type_id = ANY($1::int[])
    `;

    const { rows } = await pool.query(query, [roomTypeIds]);
    return rows;
  }

  async getRoomAvailabilityByRoomTypeIds(roomTypeIds = [], checkIn, checkOut) {
    if (!roomTypeIds.length) return [];

    const query = `
      SELECT
        r.room_type_id,
        MAX(COALESCE(r.capacity, 0))::int AS max_capacity,
        COUNT(*)::int AS total_rooms,
        COUNT(*) FILTER (
          WHERE COALESCE(r.is_available, true) = true
          AND NOT EXISTS (
            SELECT 1
            FROM booking b
            JOIN booking_detail bd ON bd.booking_id = b.id
            WHERE bd.room_id = r.room_id
              AND b.status NOT IN ('Cancelled', 'Rejected')
              AND b.deleted_at IS NULL
              AND b.check_in < $3
              AND b.check_out > $2
          )
        )::int AS available_rooms
      FROM rooms r
      WHERE r.room_type_id = ANY($1::int[])
      GROUP BY r.room_type_id
    `;

    const { rows } = await pool.query(query, [roomTypeIds, checkIn, checkOut]);
    return rows;
  }
}

export const clientHotelsRepository = new ClientHotelsRepository();
