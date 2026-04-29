import { pool } from "../../../../config/db.config.js";

class PaymentRepository {
  // Tạo record thanh toán trạng thái 'Pending'
  async createPayment(data) {
    const query = `
      INSERT INTO public.payment (booking_id, amount, payment_method, status)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const res = await pool.query(query, [data.booking_id, data.amount, data.payment_method, 'Pending']);
    return res.rows[0];
  }

  async markPaymentSuccess(paymentId, bookingId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const updatePaymentQ = `
        UPDATE public.payment 
        SET status = 'Success', paid_at = NOW() 
        WHERE id = $1 RETURNING *;
      `;
      const paymentRes = await client.query(updatePaymentQ, [paymentId]);

      // Cập nhật bảng booking
      const updateBookingQ = `
        UPDATE public.booking 
        SET status = 'Confirmed', updated_at = NOW() 
        WHERE id = $1;
      `;
      await client.query(updateBookingQ, [bookingId]);

      await client.query("COMMIT");
      return paymentRes.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Dùng khi thanh toán thất bại
  async updatePaymentStatusOnly(paymentId, status) {
    const query = `
      UPDATE public.payment 
      SET status = $1 
      WHERE id = $2 RETURNING *;
    `;
    const res = await pool.query(query, [status, paymentId]);
    return res.rows[0];
  }
}

export const paymentRepository = new PaymentRepository();
