-- Seed 40 bookings for hotel: Pullman Saigon Riverside
-- Idempotent: can run multiple times without duplicating booking numbers.

BEGIN;

WITH target_hotel AS (
  SELECT id
  FROM public.hotels
  WHERE name = 'Pullman Saigon Riverside'
  LIMIT 1
),
room_type_ranked AS (
  SELECT
    rt.id AS room_type_id,
    rt.base_price,
    row_number() OVER (ORDER BY rt.base_price DESC, rt.name ASC) AS rn,
    count(*) OVER () AS total_room_types
  FROM public.room_types rt
  JOIN target_hotel th ON th.id = rt.hotel_id
),
customer_ranked AS (
  SELECT
    c.id AS customer_id,
    row_number() OVER (ORDER BY c.created_at ASC, c.email ASC) AS rn,
    count(*) OVER () AS total_customers
  FROM public.customers c
),
seed_rows AS (
  SELECT
    i AS idx,
    format('PSR-2026-%s', lpad(i::text, 4, '0')) AS booking_number,
    th.id AS hotel_id,
    rtr.room_type_id,
    rtr.base_price,
    cr.customer_id,
    (CURRENT_DATE - ((i * 2) % 120) - 10)::date AS checkin_date,
    (CURRENT_DATE - ((i * 2) % 120) - 7)::date AS checkout_date,
    3::int AS total_nights,
    CASE
      WHEN i % 8 = 0 THEN 'CANCELLED'
      WHEN i % 5 = 0 THEN 'PENDING'
      WHEN i % 3 = 0 THEN 'COMPLETED'
      ELSE 'CONFIRMED'
    END AS booking_status,
    CASE
      WHEN i % 8 = 0 THEN 'REFUNDED'
      WHEN i % 6 = 0 THEN 'FAILED'
      WHEN i % 4 = 0 THEN 'PENDING'
      ELSE 'PAID'
    END AS payment_status,
    CASE
      WHEN i % 4 = 0 THEN 'OTA'
      WHEN i % 3 = 0 THEN 'CORPORATE'
      ELSE 'DIRECT'
    END AS source_channel,
    (NOW() - (((i * 2) % 120) || ' days')::interval - ((i % 18) || ' hours')::interval) AS created_at
  FROM generate_series(1, 40) AS g(i)
  CROSS JOIN target_hotel th
  JOIN room_type_ranked rtr ON rtr.rn = ((i - 1) % rtr.total_room_types) + 1
  JOIN customer_ranked cr ON cr.rn = ((i - 1) % cr.total_customers) + 1
),
booking_financials AS (
  SELECT
    sr.*,
    round((sr.base_price * sr.total_nights)::numeric, 2) AS subtotal_amount,
    round((sr.base_price * sr.total_nights * (CASE WHEN sr.idx % 7 = 0 THEN 0.10 ELSE 0.04 END))::numeric, 2) AS discount_amount,
    round((sr.base_price * sr.total_nights * 0.10)::numeric, 2) AS tax_amount,
    round((sr.base_price * sr.total_nights * 0.05)::numeric, 2) AS service_charge_amount
  FROM seed_rows sr
),
upsert_bookings AS (
  INSERT INTO public.bookings (
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
    source_channel,
    created_at
  )
  SELECT
    bf.booking_number,
    bf.hotel_id,
    bf.customer_id,
    bf.checkin_date,
    bf.checkout_date,
    bf.total_nights,
    bf.subtotal_amount,
    bf.discount_amount,
    bf.tax_amount,
    bf.service_charge_amount,
    round((bf.subtotal_amount - bf.discount_amount + bf.tax_amount + bf.service_charge_amount)::numeric, 2) AS final_amount,
    'VND',
    bf.booking_status,
    bf.payment_status,
    bf.source_channel,
    bf.created_at
  FROM booking_financials bf
  ON CONFLICT (booking_number) DO UPDATE SET
    hotel_id = EXCLUDED.hotel_id,
    customer_id = EXCLUDED.customer_id,
    checkin_date = EXCLUDED.checkin_date,
    checkout_date = EXCLUDED.checkout_date,
    total_nights = EXCLUDED.total_nights,
    subtotal_amount = EXCLUDED.subtotal_amount,
    discount_amount = EXCLUDED.discount_amount,
    tax_amount = EXCLUDED.tax_amount,
    service_charge_amount = EXCLUDED.service_charge_amount,
    final_amount = EXCLUDED.final_amount,
    currency = EXCLUDED.currency,
    booking_status = EXCLUDED.booking_status,
    payment_status = EXCLUDED.payment_status,
    source_channel = EXCLUDED.source_channel,
    created_at = EXCLUDED.created_at
  RETURNING id, booking_number
),
booking_item_source AS (
  SELECT
    b.id AS booking_id,
    bf.room_type_id,
    bf.subtotal_amount,
    bf.discount_amount
  FROM public.bookings b
  JOIN booking_financials bf ON bf.booking_number = b.booking_number
),
insert_booking_items AS (
  INSERT INTO public.booking_items (
    booking_id,
    room_type_id,
    rate_plan_id,
    room_id,
    quantity,
    adults,
    children,
    nightly_price_total,
    los_discount,
    total_price
  )
  SELECT
    bis.booking_id,
    bis.room_type_id,
    NULL,
    NULL,
    1,
    2,
    0,
    bis.subtotal_amount,
    bis.discount_amount,
    round((bis.subtotal_amount - bis.discount_amount)::numeric, 2)
  FROM booking_item_source bis
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.booking_items bi
    WHERE bi.booking_id = bis.booking_id
  )
  RETURNING booking_id
)
INSERT INTO public.payments (
  booking_id,
  payment_method,
  provider,
  transaction_id,
  amount,
  payment_status,
  paid_at,
  created_at
)
SELECT
  b.id AS booking_id,
  CASE
    WHEN b.source_channel = 'CORPORATE' THEN 'bank_transfer'
    WHEN b.source_channel = 'OTA' THEN 'credit_card'
    ELSE 'vnpay'
  END AS payment_method,
  CASE
    WHEN b.source_channel = 'OTA' THEN 'stripe'
    WHEN b.source_channel = 'CORPORATE' THEN 'manual'
    ELSE 'vnpay'
  END AS provider,
  format('TXN-PSR-%s', lpad((row_number() OVER (ORDER BY b.booking_number))::text, 4, '0')) AS transaction_id,
  b.final_amount,
  b.payment_status,
  CASE WHEN b.payment_status = 'PAID' THEN b.created_at + interval '1 hour' ELSE NULL END AS paid_at,
  b.created_at
FROM public.bookings b
WHERE b.booking_number LIKE 'PSR-2026-%'
  AND NOT EXISTS (
    SELECT 1 FROM public.payments p WHERE p.booking_id = b.id
  );

COMMIT;
