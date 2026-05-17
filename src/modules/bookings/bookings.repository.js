import { randomUUID } from "crypto";
import { query, withTransaction } from "../../configs/postgres.js";
import { getPagination } from "../../common/pagination.js";

const buildWhereClause = (queryParams = {}, filterableFields = []) => {
  const filters = [];
  const values = [];
  const q = String(queryParams.q || "").trim();

  for (const field of filterableFields) {
    if (queryParams[field] !== undefined && queryParams[field] !== "") {
      values.push(queryParams[field]);
      filters.push(`${field} = $${values.length}`);
    }
  }

  if (q) {
    values.push(`%${q}%`);
    filters.push(`booking_number ILIKE $${values.length}`);
  }

  return {
    whereClause: filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "",
    values,
  };
};

export const bookingsRepository = {
  async getBookingByIdAndHotel(bookingId, hotelId) {
    const { rows } = await query(
      `
        SELECT
          b.*,
          h.name AS hotel_name,
          c.first_name,
          c.last_name,
          c.email AS customer_email
        FROM public.bookings b
        LEFT JOIN public.hotels h ON h.id = b.hotel_id
        LEFT JOIN public.customers c ON c.id = b.customer_id
        WHERE b.id = $1::uuid
          AND b.hotel_id = $2::uuid
        LIMIT 1
      `,
      [bookingId, hotelId],
    );

    return rows[0] || null;
  },

  async getBookingByNumberAndHotel(bookingNumber, hotelId) {
    const { rows } = await query(
      `
        SELECT
          b.*,
          h.name AS hotel_name,
          c.first_name,
          c.last_name,
          c.email AS customer_email
        FROM public.bookings b
        LEFT JOIN public.hotels h ON h.id = b.hotel_id
        LEFT JOIN public.customers c ON c.id = b.customer_id
        WHERE b.booking_number = $1
          AND b.hotel_id = $2::uuid
        LIMIT 1
      `,
      [bookingNumber, hotelId],
    );

    return rows[0] || null;
  },

  async getHotelRoomBoardByDate({ hotelId, date }) {
    const { rows } = await query(
      `
        WITH occupied AS (
          SELECT
            bi.room_type_id,
            COUNT(*)::int AS occupied_count
          FROM public.bookings b
          JOIN public.booking_items bi ON bi.booking_id = b.id
          WHERE b.hotel_id = $1::uuid
            AND b.checkin_date <= $2::date
            AND b.checkout_date > $2::date
            AND UPPER(COALESCE(b.booking_status, '')) NOT IN ('CANCELLED', 'CHECKED_OUT')
          GROUP BY bi.room_type_id
        )
        SELECT
          rt.id::text AS room_type_id,
          rt.name AS room_type_name,
          COALESCE(rt.total_inventory, 0)::int AS total_inventory,
          COALESCE(o.occupied_count, 0)::int AS occupied_count,
          GREATEST(COALESCE(rt.total_inventory, 0)::int - COALESCE(o.occupied_count, 0)::int, 0)::int AS available_count
        FROM public.room_types rt
        LEFT JOIN occupied o ON o.room_type_id = rt.id
        WHERE rt.hotel_id = $1::uuid
        ORDER BY rt.name ASC
      `,
      [hotelId, date],
    );

    return rows;
  },

  async listByHotelAndDate({ hotelId, date, limit = 100, offset = 0 }) {
    const { rows } = await query(
      `
        SELECT
          b.*,
          h.name AS hotel_name,
          rt_first.room_type_id,
          rt_first.name AS room_type_name,
          c.first_name,
          c.last_name,
          c.email AS customer_email,
          c.phone AS customer_phone
        FROM public.bookings b
        LEFT JOIN public.hotels h ON h.id = b.hotel_id
        LEFT JOIN public.customers c ON c.id = b.customer_id
        LEFT JOIN LATERAL (
          SELECT rt.id::text AS room_type_id, rt.name
          FROM public.booking_items bi
          JOIN public.room_types rt ON rt.id = bi.room_type_id
          WHERE bi.booking_id = b.id
          ORDER BY bi.id
          LIMIT 1
        ) rt_first ON TRUE
        WHERE b.hotel_id = $1::uuid
          AND b.checkin_date <= $2::date
          AND b.checkout_date > $2::date
        ORDER BY b.checkin_date ASC, b.created_at DESC
        LIMIT $3
        OFFSET $4
      `,
      [hotelId, date, limit, offset],
    );

    return rows;
  },

  async updateBookingStatusByHotel(bookingId, hotelId, bookingStatus) {
    const { rows } = await query(
      `
        UPDATE public.bookings
        SET booking_status = $1
        WHERE id = $2::uuid
          AND hotel_id = $3::uuid
        RETURNING *
      `,
      [bookingStatus, bookingId, hotelId],
    );

    return rows[0] || null;
  },

  async updateBookingPaymentStatusByHotel(bookingId, hotelId, paymentStatus) {
    const { rows } = await query(
      `
        UPDATE public.bookings
        SET payment_status = $1
        WHERE id = $2::uuid
          AND hotel_id = $3::uuid
        RETURNING *
      `,
      [paymentStatus, bookingId, hotelId],
    );

    return rows[0] || null;
  },

  async listHistory(queryParams = {}) {
    const pagination = getPagination(queryParams);
    const filters = [];
    const values = [];
    const q = String(queryParams.q || "").trim();

    if (queryParams.hotel_id) {
      values.push(queryParams.hotel_id);
      filters.push(`b.hotel_id = $${values.length}`);
    }

    if (queryParams.customer_email) {
      values.push(String(queryParams.customer_email).trim().toLowerCase());
      filters.push(`EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = b.customer_id
          AND LOWER(c.email) = $${values.length}
      )`);
    }

    if (queryParams.booking_status) {
      values.push(queryParams.booking_status);
      filters.push(`b.booking_status = $${values.length}`);
    }

    if (queryParams.payment_status) {
      values.push(queryParams.payment_status);
      filters.push(`b.payment_status = $${values.length}`);
    }

    if (q) {
      values.push(`%${q}%`);
      filters.push(`(
        b.booking_number ILIKE $${values.length}
        OR EXISTS (
          SELECT 1
          FROM public.hotels h
          WHERE h.id = b.hotel_id
            AND h.name ILIKE $${values.length}
        )
        OR EXISTS (
          SELECT 1
          FROM public.booking_items bi
          JOIN public.room_types rt ON rt.id = bi.room_type_id
          WHERE bi.booking_id = b.id
            AND rt.name ILIKE $${values.length}
        )
      )`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM public.bookings b
      ${whereClause}
    `;

    const pageSql = `
      WITH paged_bookings AS (
        SELECT b.id
        FROM public.bookings b
        ${whereClause}
        ORDER BY b.created_at DESC
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
      )
      SELECT
        b.*,
        h.name AS hotel_name,
        h.city AS hotel_city,
        rt_first.name AS room_type_name,
        c.first_name,
        c.last_name,
        c.email AS customer_email,
        c.phone AS customer_phone,
        COALESCE(facilities.items, '[]'::json) AS facilities
      FROM paged_bookings pb
      JOIN public.bookings b ON b.id = pb.id
      LEFT JOIN public.hotels h ON h.id = b.hotel_id
      LEFT JOIN public.customers c ON c.id = b.customer_id
      LEFT JOIN LATERAL (
        SELECT rt.name
        FROM public.booking_items bi
        JOIN public.room_types rt ON rt.id = bi.room_type_id
        WHERE bi.booking_id = b.id
        ORDER BY bi.id
        LIMIT 1
      ) rt_first ON TRUE
      LEFT JOIN LATERAL (
        SELECT json_agg(
          jsonb_build_object(
            'id', f.id,
            'name', f.name,
            'price', bf.total_price,
            'quantity', bf.quantity
          )
        ) FILTER (WHERE f.id IS NOT NULL) AS items
        FROM public.booking_facilities bf
        LEFT JOIN public.facilities f ON f.id = bf.facility_id
        WHERE bf.booking_id = b.id
      ) facilities ON TRUE
      ORDER BY b.created_at DESC
    `;

    const [pageResult, countResult] = await Promise.all([
      query(pageSql, [...values, pagination.limit, pagination.offset]),
      query(countSql, values),
    ]);

    return {
      items: pageResult.rows,
      pagination: {
        ...pagination,
        total: countResult.rows[0]?.total || 0,
      },
    };
  },

  async list(queryParams = {}, model) {
    const pagination = getPagination(queryParams);
    const { whereClause, values } = buildWhereClause(queryParams, model.filterableFields);

    const listSql = `
      SELECT *
      FROM public.bookings
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM public.bookings
      ${whereClause}
    `;

    const [{ rows }, countResult] = await Promise.all([
      query(listSql, [...values, pagination.limit, pagination.offset]),
      query(countSql, values),
    ]);

    return {
      items: rows,
      pagination: {
        ...pagination,
        total: countResult.rows[0]?.total || 0,
      },
    };
  },

  async getById(id) {
    const { rows } = await query(
      `
        SELECT *
        FROM public.bookings
        WHERE id = $1
        LIMIT 1
      `,
      [id],
    );

    return rows[0] || null;
  },

  async getBookingSummary(id) {
    const { rows } = await query(
      `
        SELECT
          b.*,
          h.name AS hotel_name,
          rt.name AS room_type_name
        FROM public.bookings b
        LEFT JOIN public.hotels h ON h.id = b.hotel_id
        LEFT JOIN public.booking_items bi ON bi.booking_id = b.id
        LEFT JOIN public.room_types rt ON rt.id = bi.room_type_id
        WHERE b.id = $1
        LIMIT 1
      `,
      [id],
    );

    return rows[0] || null;
  },

  async getBookingEmailContext(id) {
    const { rows } = await query(
      `
        SELECT
          b.id,
          b.booking_number,
          b.checkin_date,
          b.checkout_date,
          b.subtotal_amount,
          b.discount_amount,
          b.tax_amount,
          b.service_charge_amount,
          b.final_amount,
          b.currency,
          h.name AS hotel_name,
          rt.name AS room_type_name,
          c.email AS customer_email,
          CONCAT_WS(' ', c.first_name, c.last_name) AS customer_name,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', f.id,
                'name', f.name,
                'quantity', bf.quantity,
                'unitPrice', bf.unit_price,
                'totalPrice', bf.total_price
              )
            ) FILTER (WHERE f.id IS NOT NULL),
            '[]'::json
          ) AS facilities
        FROM public.bookings b
        LEFT JOIN public.hotels h ON h.id = b.hotel_id
        LEFT JOIN public.booking_items bi ON bi.booking_id = b.id
        LEFT JOIN public.room_types rt ON rt.id = bi.room_type_id
        LEFT JOIN public.customers c ON c.id = b.customer_id
        LEFT JOIN public.booking_facilities bf ON bf.booking_id = b.id
        LEFT JOIN public.facilities f ON f.id = bf.facility_id
        WHERE b.id = $1
        GROUP BY
          b.id,
          b.booking_number,
          b.checkin_date,
          b.checkout_date,
          b.subtotal_amount,
          b.discount_amount,
          b.tax_amount,
          b.service_charge_amount,
          b.final_amount,
          b.currency,
          h.name,
          rt.name,
          c.email,
          c.first_name,
          c.last_name
        LIMIT 1
      `,
      [id],
    );

    return rows[0] || null;
  },

  async update(id, payload = {}, model) {
    const updates = {};

    for (const field of model.updateFields) {
      if (payload[field] !== undefined) {
        updates[field] = payload[field];
      }
    }

    const entries = Object.entries(updates);
    if (!entries.length) {
      return this.getById(id);
    }

    const values = [];
    const setClause = entries
      .map(([key, value], index) => {
        values.push(value);
        return `${key} = $${index + 1}`;
      })
      .join(", ");

    values.push(id);

    const { rows } = await query(
      `
        UPDATE public.bookings
        SET ${setClause}
        WHERE id = $${values.length}
        RETURNING *
      `,
      values,
    );

    return rows[0] || null;
  },

  async remove(id) {
    const { rows } = await query(
      `
        DELETE FROM public.bookings
        WHERE id = $1
        RETURNING *
      `,
      [id],
    );

    return rows[0] || null;
  },

  async findAvailability(roomTypeId, dates = []) {
    if (!dates.length) {
      return [];
    }

    const { rows } = await query(
      `
        SELECT *
        FROM public.daily_inventory
        WHERE room_type_id = $1
          AND inventory_date = ANY($2::date[])
        ORDER BY inventory_date ASC
      `,
      [roomTypeId, dates],
    );

    return rows;
  },

  async createBooking(payload) {
    return withTransaction(async (client) => {
      const customerId = randomUUID();
      const bookingId = randomUUID();

      const customerResult = await client.query(
        `
          INSERT INTO public.customers (id, first_name, last_name, email, phone, nationality, loyalty_tier)
          VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (email)
          DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            phone = EXCLUDED.phone,
            nationality = EXCLUDED.nationality,
            loyalty_tier = EXCLUDED.loyalty_tier
          RETURNING *
        `,
        [
          customerId,
          payload.customer.firstName,
          payload.customer.lastName,
          payload.customer.email,
          payload.customer.phone,
          payload.customer.nationality,
          payload.customer.loyaltyTier,
        ],
      );

      const customer = customerResult.rows[0];

      const bookingResult = await client.query(
        `
          INSERT INTO public.bookings (
            id,
            booking_number,
            hotel_id,
            customer_id,
            checkin_date,
            checkout_date,
            total_nights,
            subtotal_amount,
            discount_amount,
            tax_amount,
            service_charge_amount,
            final_amount,
            currency,
            booking_status,
            payment_status,
            source_channel
          )
          VALUES (
            $1::uuid,
            $2,
            $3::uuid,
            $4::uuid,
            $5::date,
            $6::date,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15,
            $16
          )
          RETURNING *
        `,
        [
          bookingId,
          payload.bookingNumber,
          payload.hotelId,
          customer.id,
          payload.checkIn,
          payload.checkOut,
          payload.totalNights,
          payload.subtotalAmount,
          payload.discountAmount,
          payload.taxAmount,
          payload.serviceChargeAmount,
          payload.finalAmount,
          payload.currency,
          payload.bookingStatus,
          payload.paymentStatus,
          payload.sourceChannel,
        ],
      );

      await client.query(
        `
          INSERT INTO public.booking_items (
            id,
            booking_id,
            room_type_id,
            rate_plan_id,
            quantity,
            adults,
            children,
            nightly_price_total,
            los_discount,
            total_price
          )
          VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, $9, $10)
        `,
        [
          randomUUID(),
          bookingId,
          payload.roomTypeId,
          payload.ratePlanId,
          1,
          payload.adults,
          payload.children,
          payload.subtotalAmount,
          payload.discountAmount,
          payload.finalAmount,
        ],
      );

      for (const facility of payload.facilities) {
        await client.query(
          `
            INSERT INTO public.booking_facilities (
              id,
              booking_id,
              facility_id,
              quantity,
              unit_price,
              total_price
            )
            VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6)
          `,
          [randomUUID(), bookingId, facility.id, 1, facility.base_price, facility.base_price],
        );
      }

      if (payload.promotionId) {
        await client.query(
          `
            INSERT INTO public.booking_promotions (booking_id, promotion_id)
            VALUES ($1::uuid, $2::uuid)
          `,
          [bookingId, payload.promotionId],
        );
      }

      for (const date of payload.stayDates) {
        await client.query(
          `
            UPDATE public.daily_inventory
            SET sold_inventory = sold_inventory + 1,
                available_inventory = GREATEST(available_inventory - 1, 0)
            WHERE room_type_id = $1::uuid
              AND inventory_date = $2::date
          `,
          [payload.roomTypeId, date],
        );
      }

      return bookingResult.rows[0];
    });
  },

  async updateBookingPaymentState(bookingId, payload = {}) {
    const values = [];
    const updates = [];

    if (payload.bookingStatus !== undefined) {
      values.push(payload.bookingStatus);
      updates.push(`booking_status = $${values.length}`);
    }

    if (payload.paymentStatus !== undefined) {
      values.push(payload.paymentStatus);
      updates.push(`payment_status = $${values.length}`);
    }

    if (!updates.length) {
      return this.getById(bookingId);
    }

    values.push(bookingId);

    const { rows } = await query(
      `
        UPDATE public.bookings
        SET ${updates.join(", ")}
        WHERE id = $${values.length}
        RETURNING *
      `,
      values,
    );

    return rows[0] || null;
  },

  async restoreInventoryForBooking(bookingId) {
    const { rows } = await query(
      `
        SELECT bi.room_type_id, b.checkin_date, b.checkout_date
        FROM public.bookings b
        INNER JOIN public.booking_items bi ON bi.booking_id = b.id
        WHERE b.id = $1
        LIMIT 1
      `,
      [bookingId],
    );

    const booking = rows[0];
    if (!booking) {
      return { restored: false };
    }

    await query(
      `
        UPDATE public.daily_inventory
        SET sold_inventory = GREATEST(sold_inventory - 1, 0),
            available_inventory = available_inventory + 1
        WHERE room_type_id = $1::uuid
          AND inventory_date >= $2::date
          AND inventory_date < $3::date
      `,
      [booking.room_type_id, booking.checkin_date, booking.checkout_date],
    );

    return { restored: true };
  },
};
