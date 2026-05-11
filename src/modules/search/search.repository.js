import { query } from "../../configs/postgres.js";

export const searchRepository = {
  async searchAvailability({ hotelId, roomTypeId, checkIn, checkOut, guests = 1 }) {
    const params = [checkIn, checkOut, Number(guests) || 1];
    const conditions = [
      "COALESCE(rt.max_adults, 0) + COALESCE(rt.max_children, 0) >= $3",
    ];

    if (hotelId) {
      params.push(hotelId);
      conditions.push(`h.id = $${params.length}`);
    }

    if (roomTypeId) {
      params.push(roomTypeId);
      conditions.push(`rt.id = $${params.length}`);
    }

    const { rows } = await query(
      `
        WITH inventory_agg AS (
          SELECT
            di.room_type_id,
            MIN(di.available_inventory) AS available_inventory
          FROM public.daily_inventory di
          WHERE di.inventory_date >= $1
            AND di.inventory_date < $2
            AND di.closed = false
            AND di.stop_sell = false
          GROUP BY di.room_type_id
        ),
        rates_agg AS (
          SELECT
            dr.room_type_id,
            AVG(COALESCE(dr.final_rate, dr.base_rate, 0)) AS average_rate,
            SUM(COALESCE(dr.final_rate, dr.base_rate, 0)) AS stay_total
          FROM public.daily_rates dr
          WHERE dr.rate_date >= $1
            AND dr.rate_date < $2
            AND dr.closed = false
            AND dr.stop_sell = false
          GROUP BY dr.room_type_id
        )
        SELECT
          h.id AS hotel_id,
          h.code AS hotel_code,
          h.name AS hotel_name,
          h.city,
          h.country,
          h.star_rating,
          rt.id AS room_type_id,
          rt.code AS room_type_code,
          rt.name AS room_type_name,
          rt.max_adults,
          rt.max_children,
          COALESCE(inv.available_inventory, 0) AS available_inventory,
          COALESCE(rates.average_rate, rt.base_price, 0) AS average_rate,
          COALESCE(rates.stay_total, 0) AS stay_total
        FROM public.hotels h
        INNER JOIN public.room_types rt ON rt.hotel_id = h.id
        LEFT JOIN inventory_agg inv ON inv.room_type_id = rt.id
        LEFT JOIN rates_agg rates ON rates.room_type_id = rt.id
        WHERE ${conditions.join(" AND ")}
        AND COALESCE(inv.available_inventory, 0) > 0
        ORDER BY average_rate ASC, h.star_rating DESC
      `,
      params,
    );

    return rows;
  },
};
