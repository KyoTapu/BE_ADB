import { pool } from "../config/db.js";
class BookingRepository {
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