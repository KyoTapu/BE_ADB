import { checkDatabaseConnection, query } from "../src/configs/postgres.js";

const horizonDays = Number(process.argv[2]) || 180;
const startDate = process.argv[3] || new Date().toISOString().slice(0, 10);

const run = async () => {
  try {
    await checkDatabaseConnection();

    const inventoryResult = await query(
      `
        WITH days AS (
          SELECT generate_series(
            $1::date,
            ($1::date + ($2::int - 1)),
            interval '1 day'
          )::date AS inventory_date
        ),
        room_base AS (
          SELECT
            rt.hotel_id,
            rt.id AS room_type_id,
            GREATEST(COALESCE(rt.total_inventory, 0), 0) AS total_inventory
          FROM public.room_types rt
        ),
        source_rows AS (
          SELECT
            rb.hotel_id,
            rb.room_type_id,
            d.inventory_date,
            rb.total_inventory,
            0::int AS sold_inventory,
            rb.total_inventory::int AS available_inventory
          FROM room_base rb
          CROSS JOIN days d
        )
        INSERT INTO public.daily_inventory (
          hotel_id,
          room_type_id,
          inventory_date,
          total_inventory,
          sold_inventory,
          available_inventory,
          stop_sell,
          closed
        )
        SELECT
          sr.hotel_id,
          sr.room_type_id,
          sr.inventory_date,
          sr.total_inventory,
          sr.sold_inventory,
          sr.available_inventory,
          FALSE,
          FALSE
        FROM source_rows sr
        ON CONFLICT (room_type_id, inventory_date)
        DO UPDATE SET
          hotel_id = EXCLUDED.hotel_id,
          total_inventory = EXCLUDED.total_inventory,
          sold_inventory = LEAST(public.daily_inventory.sold_inventory, EXCLUDED.total_inventory),
          available_inventory = GREATEST(EXCLUDED.total_inventory - LEAST(public.daily_inventory.sold_inventory, EXCLUDED.total_inventory), 0),
          stop_sell = FALSE,
          closed = FALSE
      `,
      [startDate, horizonDays],
    );

    const ratesResult = await query(
      `
        WITH days AS (
          SELECT generate_series(
            $1::date,
            ($1::date + ($2::int - 1)),
            interval '1 day'
          )::date AS rate_date
        ),
        room_base AS (
          SELECT
            rt.hotel_id,
            rt.id AS room_type_id,
            COALESCE(rt.base_price, 0)::numeric(12,2) AS base_price
          FROM public.room_types rt
        ),
        source_rows AS (
          SELECT
            rb.hotel_id,
            rb.room_type_id,
            d.rate_date,
            rb.base_price,
            CASE
              WHEN EXTRACT(ISODOW FROM d.rate_date) IN (6, 7) THEN 1.10::numeric
              ELSE 1.00::numeric
            END AS weekend_factor
          FROM room_base rb
          CROSS JOIN days d
        )
        INSERT INTO public.daily_rates (
          hotel_id,
          room_type_id,
          rate_plan_id,
          rate_date,
          base_rate,
          occupancy_factor,
          season_factor,
          weekend_factor,
          event_factor,
          demand_factor,
          final_rate,
          currency,
          stop_sell,
          closed
        )
        SELECT
          sr.hotel_id,
          sr.room_type_id,
          NULL,
          sr.rate_date,
          sr.base_price,
          1.00,
          1.00,
          sr.weekend_factor,
          1.00,
          1.00,
          ROUND((sr.base_price * sr.weekend_factor)::numeric, 2),
          'VND',
          FALSE,
          FALSE
        FROM source_rows sr
        WHERE NOT EXISTS (
          SELECT 1
          FROM public.daily_rates dr
          WHERE dr.room_type_id = sr.room_type_id
            AND dr.rate_date = sr.rate_date
            AND dr.rate_plan_id IS NULL
        )
      `,
      [startDate, horizonDays],
    );

    console.log(
      JSON.stringify(
        {
          success: true,
          startDate,
          horizonDays,
          inventoryUpserted: inventoryResult.rowCount ?? 0,
          ratesInserted: ratesResult.rowCount ?? 0,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error("Failed to sync inventory/rates:", error);
    process.exit(1);
  }
};

run();
