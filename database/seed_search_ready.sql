-- Seed tối thiểu để search trả kết quả ngay.
-- Tạo:
-- 1 hotel
-- 2 room types
-- daily_inventory cho 14 ngày tính từ CURRENT_DATE
-- daily_rates cho 14 ngày tính từ CURRENT_DATE

INSERT INTO public.hotels (
  code,
  name,
  brand,
  country,
  city,
  district,
  address,
  star_rating,
  timezone,
  total_rooms,
  status
)
VALUES (
  'SEARCH-DEMO-HTL',
  'Pullman Search Demo Hotel',
  'Pullman',
  'Vietnam',
  'Ho Chi Minh City',
  'District 1',
  '01 Nguyen Hue, District 1, Ho Chi Minh City',
  5,
  'Asia/Ho_Chi_Minh',
  20,
  'ACTIVE'
)
ON CONFLICT (code)
DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  country = EXCLUDED.country,
  city = EXCLUDED.city,
  district = EXCLUDED.district,
  address = EXCLUDED.address,
  star_rating = EXCLUDED.star_rating,
  timezone = EXCLUDED.timezone,
  total_rooms = EXCLUDED.total_rooms,
  status = EXCLUDED.status,
  updated_at = NOW();

WITH hotel_row AS (
  SELECT id
  FROM public.hotels
  WHERE code = 'SEARCH-DEMO-HTL'
  LIMIT 1
)
INSERT INTO public.room_types (
  hotel_id,
  code,
  name,
  description,
  room_size,
  max_adults,
  max_children,
  bed_type,
  smoking_allowed,
  base_price,
  total_inventory
)
SELECT
  id,
  'SEARCH-DLX',
  'Deluxe Search Room',
  'Room type demo cho search flow.',
  38,
  2,
  1,
  'King',
  FALSE,
  2200000,
  10
FROM hotel_row
WHERE NOT EXISTS (
  SELECT 1
  FROM public.room_types rt
  WHERE rt.hotel_id = hotel_row.id
    AND rt.code = 'SEARCH-DLX'
);

WITH hotel_row AS (
  SELECT id
  FROM public.hotels
  WHERE code = 'SEARCH-DEMO-HTL'
  LIMIT 1
)
INSERT INTO public.room_types (
  hotel_id,
  code,
  name,
  description,
  room_size,
  max_adults,
  max_children,
  bed_type,
  smoking_allowed,
  base_price,
  total_inventory
)
SELECT
  id,
  'SEARCH-STE',
  'Executive Search Suite',
  'Suite demo cho search flow.',
  52,
  3,
  1,
  'King + Sofa',
  FALSE,
  3200000,
  8
FROM hotel_row
WHERE NOT EXISTS (
  SELECT 1
  FROM public.room_types rt
  WHERE rt.hotel_id = hotel_row.id
    AND rt.code = 'SEARCH-STE'
);

WITH hotel_row AS (
  SELECT id
  FROM public.hotels
  WHERE code = 'SEARCH-DEMO-HTL'
  LIMIT 1
),
room_type_1 AS (
  SELECT id, hotel_id
  FROM public.room_types
  WHERE hotel_id = (SELECT id FROM hotel_row)
    AND code = 'SEARCH-DLX'
  LIMIT 1
),
room_type_2 AS (
  SELECT id, hotel_id
  FROM public.room_types
  WHERE hotel_id = (SELECT id FROM hotel_row)
    AND code = 'SEARCH-STE'
  LIMIT 1
),
seed_dates AS (
  SELECT generate_series(
    CURRENT_DATE::timestamp,
    (CURRENT_DATE + 13)::timestamp,
    INTERVAL '1 day'
  )::date AS stay_date
),
inventory_rows AS (
  SELECT hotel_id, id AS room_type_id, stay_date, 10 AS total_inventory, 2 AS sold_inventory, 8 AS available_inventory
  FROM room_type_1
  CROSS JOIN seed_dates
  UNION ALL
  SELECT hotel_id, id AS room_type_id, stay_date, 8 AS total_inventory, 1 AS sold_inventory, 7 AS available_inventory
  FROM room_type_2
  CROSS JOIN seed_dates
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
  hotel_id,
  room_type_id,
  stay_date,
  total_inventory,
  sold_inventory,
  available_inventory,
  FALSE,
  FALSE
FROM inventory_rows
ON CONFLICT (room_type_id, inventory_date)
DO UPDATE SET
  hotel_id = EXCLUDED.hotel_id,
  total_inventory = EXCLUDED.total_inventory,
  sold_inventory = EXCLUDED.sold_inventory,
  available_inventory = EXCLUDED.available_inventory,
  stop_sell = FALSE,
  closed = FALSE;

WITH hotel_row AS (
  SELECT id
  FROM public.hotels
  WHERE code = 'SEARCH-DEMO-HTL'
  LIMIT 1
),
room_type_1 AS (
  SELECT id, hotel_id
  FROM public.room_types
  WHERE hotel_id = (SELECT id FROM hotel_row)
    AND code = 'SEARCH-DLX'
  LIMIT 1
),
room_type_2 AS (
  SELECT id, hotel_id
  FROM public.room_types
  WHERE hotel_id = (SELECT id FROM hotel_row)
    AND code = 'SEARCH-STE'
  LIMIT 1
),
seed_dates AS (
  SELECT generate_series(
    CURRENT_DATE::timestamp,
    (CURRENT_DATE + 13)::timestamp,
    INTERVAL '1 day'
  )::date AS stay_date
),
rate_rows AS (
  SELECT hotel_id, id AS room_type_id, stay_date, 2200000::numeric AS base_rate, 2200000::numeric AS final_rate
  FROM room_type_1
  CROSS JOIN seed_dates
  UNION ALL
  SELECT hotel_id, id AS room_type_id, stay_date, 3200000::numeric AS base_rate, 3200000::numeric AS final_rate
  FROM room_type_2
  CROSS JOIN seed_dates
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
  hotel_id,
  room_type_id,
  NULL,
  stay_date,
  base_rate,
  1.00,
  1.00,
  1.00,
  1.00,
  1.00,
  final_rate,
  'VND',
  FALSE,
  FALSE
FROM rate_rows rr
WHERE NOT EXISTS (
  SELECT 1
  FROM public.daily_rates dr
  WHERE dr.room_type_id = rr.room_type_id
    AND dr.rate_date = rr.stay_date
    AND dr.rate_plan_id IS NULL
);
