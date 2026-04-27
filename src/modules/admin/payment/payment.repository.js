import { pool } from "../../../config/db.js";

class AdminPaymentRepository {
  // Lấy lịch sử giao dịch kèm thông tin khách và khách sạn
  async getAllPayments({ status, method, hotelId, fromDate, toDate }) {
    let query = `
      SELECT p.*, u.full_name, h.hotel_name 
      FROM public.payment p
      JOIN public.booking b ON p.booking_id = b.id
      JOIN public.User u ON b.user_id = u.user_id
      JOIN public.booking_detail bd ON b.id = bd.booking_id
      JOIN public.rooms r ON bd.room_id = r.room_id
      JOIN public.room_type rt ON r.room_type_id = rt.room_type_id
      JOIN public.hotels h ON rt.hotel_id = h.hotel_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND p.status = $${params.length}`;
    }
    if (hotelId) {
      params.push(hotelId);
      query += ` AND h.hotel_id = $${params.length}`;
    }
    // Thêm lọc theo ngày thanh toán
    if (fromDate && toDate) {
      params.push(fromDate, toDate);
      query += ` AND p.paid_at BETWEEN $${params.length - 1} AND $${params.length}`;
    }

    query += ` ORDER BY p.paid_at DESC NULLS LAST, p.id DESC`;
    const res = await pool.query(query, params);
    return res.rows;
  }

  // Tạo thanh toán thủ công 
  async createManualPayment(data) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const pQuery = `
        INSERT INTO public.payment (booking_id, amount, payment_method, status, paid_at)
        VALUES ($1, $2, $3, 'Success', NOW()) RETURNING *;
      `;
      const pRes = await client.query(pQuery, [data.booking_id, data.amount, data.payment_method]);

      const bQuery = `UPDATE public.booking SET status = 'Confirmed' WHERE id = $1`;
      await client.query(bQuery, [data.booking_id]);

      await client.query("COMMIT");
      return pRes.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

export const adminPaymentRepository = new AdminPaymentRepository();