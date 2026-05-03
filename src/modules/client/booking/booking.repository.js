import { pool } from "../../../../config/db.config.js";
class BookingRepository {
  async getRoomTypeById(roomTypeId) {
    const query = `
      SELECT
        rt.room_type_id,
        rt.hotel_id,
        rt.room_type_name,
        rt.room_type_base_price,
        rt.room_type_services,
        h.hotel_name
      FROM room_type rt
      JOIN hotels h ON h.hotel_id = rt.hotel_id
      WHERE rt.room_type_id = $1
    `;
    const { rows } = await pool.query(query, [roomTypeId]);
    return rows[0] || null;
  }

  async getServicesByIds(serviceIds = []) {
    if (!serviceIds.length) return [];

    const query = `
      SELECT
        service_id,
        hotel_id,
        facility_name AS service_name,
        facility_price AS service_price,
        pricing_type
      FROM facilities
      WHERE service_id = ANY($1::int[])
    `;
    const { rows } = await pool.query(query, [serviceIds]);
    return rows;
  }

  async getSeasonalPricingByHotelId(hotelId) {
    const query = `
      SELECT season_id, hotel_id, start_date, end_date, multiplier
      FROM seasonalpricing
      WHERE hotel_id = $1
    `;
    const { rows } = await pool.query(query, [hotelId]);
    return rows;
  }

  async getSpecialDatePricingByRoomTypeId(roomTypeId) {
    const query = `
      SELECT id, room_type_id, specific_date, specific_rate, specific_note
      FROM specialdatepricing
      WHERE room_type_id = $1
    `;
    const { rows } = await pool.query(query, [roomTypeId]);
    return rows;
  }

  async findAvailableRoomByType(roomTypeId, checkIn, checkOut) {
    const query = `
      SELECT r.room_id, r.capacity, r.name, r.number
      FROM rooms r
      WHERE r.room_type_id = $1
        AND COALESCE(r.is_available, true) = true
        AND NOT EXISTS (
          SELECT 1
          FROM booking b
          JOIN booking_detail bd ON b.id = bd.booking_id
          WHERE bd.room_id = r.room_id
            AND b.status NOT IN ('Cancelled', 'Rejected')
            AND b.deleted_at IS NULL
            AND (b.check_in < $3 AND b.check_out > $2)
        )
      ORDER BY r.room_id ASC
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [roomTypeId, checkIn, checkOut]);
    return rows[0] || null;
  }

  async createWithDetails(bookingData, details) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN"); 


      const bookingQuery = `
        INSERT INTO public.booking (user_id, check_in, check_out, total_amount, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const bookingRes = await client.query(bookingQuery, [
        bookingData.user_id,
        bookingData.check_in,
        bookingData.check_out,
        bookingData.total_amount,
        bookingData.status
      ]);
      const newBooking = bookingRes.rows[0];

      const detailQuery = `
        INSERT INTO public.booking_detail (booking_id, room_id, price_at_booking, count_child, count_parent)
        VALUES ($1, $2, $3, $4, $5);
      `;
      for (const detail of details) {
        await client.query(detailQuery, [
          newBooking.id,
          detail.room_id,
          detail.price_at_booking,
          detail.count_child,
          detail.count_parent
        ]);
      }

      await client.query("COMMIT"); 
      return newBooking;
    } catch (error) {
      await client.query("ROLLBACK"); 
      throw error;
    } finally {
      client.release();
    }
  }

  async updateStatus(id, status) {
    const query = `
      UPDATE public.booking 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *;
    `;
    const res = await pool.query(query, [status, id]);
    if (res.rowCount === 0) throw new Error("Booking not found");
    return res.rows[0];
  }

  async checkRoomAvailability(roomId, checkIn, checkOut) {
    const query = `
      SELECT EXISTS (
        SELECT 1 FROM public.booking b
        JOIN public.booking_detail bd ON b.id = bd.booking_id
        WHERE bd.room_id = $1
          AND b.status NOT IN ('Cancelled', 'Rejected')
          AND b.deleted_at IS NULL
          AND (b.check_in < $3 AND b.check_out > $2)
      ) as "isBooked";
    `;
    const res = await pool.query(query, [roomId, checkIn, checkOut]);
    return !res.rows[0].isBooked; 
}
}

export const bookingRepository = new BookingRepository();
