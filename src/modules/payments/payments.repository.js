import { query } from "../../configs/postgres.js";
import { createCrudRepository } from "../../common/crud.js";
import { paymentsModel } from "./payments.model.js";

const baseRepository = createCrudRepository(paymentsModel);

export const paymentsRepository = {
  ...baseRepository,

  async createPayment(payload = {}) {
    return baseRepository.create(payload);
  },

  async getByTransactionId(transactionId) {
    const { rows } = await query(
      `
        SELECT *
        FROM public.payments
        WHERE transaction_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [transactionId],
    );

    return rows[0] || null;
  },

  async getLatestByBookingId(bookingId) {
    const { rows } = await query(
      `
        SELECT *
        FROM public.payments
        WHERE booking_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [bookingId],
    );

    return rows[0] || null;
  },

  async getBookingPaymentStatus(bookingId) {
    const { rows } = await query(
      `
        SELECT
          b.id AS booking_id,
          b.booking_number,
          b.booking_status,
          b.payment_status,
          b.final_amount,
          b.currency,
          b.checkin_date,
          b.checkout_date,
          h.name AS hotel_name,
          rt.name AS room_type_name,
          p.id AS payment_id,
          p.payment_method,
          p.provider,
          p.transaction_id,
          p.amount,
          p.paid_at,
          p.created_at AS payment_created_at
        FROM public.bookings b
        LEFT JOIN public.hotels h ON h.id = b.hotel_id
        LEFT JOIN public.booking_items bi ON bi.booking_id = b.id
        LEFT JOIN public.room_types rt ON rt.id = bi.room_type_id
        LEFT JOIN LATERAL (
          SELECT *
          FROM public.payments
          WHERE booking_id = b.id
          ORDER BY created_at DESC
          LIMIT 1
        ) p ON true
        WHERE b.id = $1
        LIMIT 1
      `,
      [bookingId],
    );

    return rows[0] || null;
  },

  async updatePaymentResultById(id, payload = {}) {
    const nextValues = [];
    const updates = [];

    const assign = (column, value) => {
      nextValues.push(value);
      updates.push(`${column} = $${nextValues.length}`);
    };

    if (payload.payment_status !== undefined) {
      assign("payment_status", payload.payment_status);
    }

    if (payload.provider !== undefined) {
      assign("provider", payload.provider);
    }

    if (payload.transaction_id !== undefined) {
      assign("transaction_id", payload.transaction_id);
    }

    if (payload.paid_at !== undefined) {
      assign("paid_at", payload.paid_at);
    }

    if (payload.amount !== undefined) {
      assign("amount", payload.amount);
    }

    if (!updates.length) {
      return baseRepository.getById(id);
    }

    nextValues.push(id);

    const { rows } = await query(
      `
        UPDATE public.payments
        SET ${updates.join(", ")}
        WHERE id = $${nextValues.length}
        RETURNING *
      `,
      nextValues,
    );

    return rows[0] || null;
  },
};
