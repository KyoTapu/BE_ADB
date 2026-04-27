import { pool } from "../../../config/db.js";

class AdminBookingRepository {
  async getAllBookings({ status, hotelId, startDate, endDate }) {
    let query = `
      SELECT b.*, u.full_name, u.email, h.hotel_name 
      FROM public.booking b
      JOIN public.User u ON b.user_id = u.user_id
      JOIN public.booking_detail bd ON b.id = bd.booking_id
      JOIN public.rooms r ON bd.room_id = r.room_id
      JOIN public.room_type rt ON r.room_type_id = rt.room_type_id
      JOIN public.hotels h ON rt.hotel_id = h.hotel_id
      WHERE b.deleted_at IS NULL
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND b.status = $${params.length}`;
    }
    if (hotelId) {
      params.push(hotelId);
      query += ` AND h.hotel_id = $${params.length}`;
    }

    query += ` ORDER BY b.created_at DESC`;
    const res = await pool.query(query, params);
    return res.rows;
  }

  async updateStatus(id, status) {
    const query = `
      UPDATE public.booking 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *;
    `;
    const res = await pool.query(query, [status, id]);
    return res.rows[0];
  }
}

export const adminBookingRepository = new AdminBookingRepository();