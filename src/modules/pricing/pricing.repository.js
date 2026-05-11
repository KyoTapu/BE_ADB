import { query } from "../../configs/postgres.js";

export const pricingRepository = {
  async getRoomTypeContext(roomTypeId) {
    const { rows } = await query(
      `
        SELECT
          rt.*,
          h.id AS hotel_id,
          h.name AS hotel_name,
          h.country
        FROM public.room_types rt
        INNER JOIN public.hotels h ON h.id = rt.hotel_id
        WHERE rt.id = $1
        LIMIT 1
      `,
      [roomTypeId],
    );

    return rows[0] || null;
  },

  async getNightlyRates({ roomTypeId, ratePlanId, checkIn, checkOut }) {
    const params = [roomTypeId, checkIn, checkOut];
    let ratePlanFilter = "";

    if (ratePlanId) {
      params.push(ratePlanId);
      ratePlanFilter = `AND rate_plan_id = $${params.length}`;
    }

    const { rows } = await query(
      `
        SELECT *
        FROM public.daily_rates
        WHERE room_type_id = $1
          AND rate_date >= $2
          AND rate_date < $3
          AND closed = false
          AND stop_sell = false
          ${ratePlanFilter}
        ORDER BY rate_date ASC
      `,
      params,
    );

    return rows;
  },

  async getFacilities(facilityIds = []) {
    if (!facilityIds.length) {
      return [];
    }

    const { rows } = await query(
      `
        SELECT *
        FROM public.facilities
        WHERE id = ANY($1::uuid[])
          AND is_active = true
      `,
      [facilityIds],
    );

    return rows;
  },

  async getPromotion(code) {
    if (!code) {
      return null;
    }

    const { rows } = await query(
      `
        SELECT *
        FROM public.promotions
        WHERE code = $1
          AND active = true
          AND CURRENT_DATE BETWEEN valid_from AND valid_to
        LIMIT 1
      `,
      [code],
    );

    return rows[0] || null;
  },

  async getTaxRules(country) {
    const { rows } = await query(
      `
        SELECT *
        FROM public.tax_rules
        WHERE active = true
          AND ($1::text IS NULL OR country = $1)
      `,
      [country || null],
    );

    return rows;
  },
};
