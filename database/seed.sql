-- =========================
-- COUNTRY
-- =========================
INSERT INTO country (country_code, country_name) VALUES
('VN', 'Vietnam'),
('TH', 'Thailand'),
('JP', 'Japan');

-- =========================
-- USERS
-- =========================
INSERT INTO user (user_id, full_name, email, phone)
VALUES
(gen_random_uuid(), 'Nguyen Van An', 'an.nguyen@gmail.com', '0901234567'),
(gen_random_uuid(), 'Tran Thi Mai', 'mai.tran@yahoo.com', '0912345678'),
(gen_random_uuid(), 'Le Quang Huy', 'huy.le@gmail.com', '0987654321');

-- =========================
-- HOTELS
-- =========================
INSERT INTO hotels (hotel_id, country_id, hotel_name, city_address, star_rating, description)
SELECT 
  gen_random_uuid(),
  c.country_id,
  h.name,
  h.address,
  h.star,
  h.description
FROM country c,
LATERAL (
  VALUES
    ('Vinpearl Resort Nha Trang', 'Nha Trang, Khanh Hoa', 5, 'Luxury beachfront resort'),
    ('Fusion Suites Da Nang', 'Da Nang', 4, 'Modern hotel near My Khe beach'),
    ('Hotel Nikko Saigon', 'Ho Chi Minh City', 5, 'Japanese standard hotel in Saigon')
) AS h(name, address, star, description)
WHERE c.country_code = 'VN';

-- =========================
-- ROOM TYPE
-- =========================
INSERT INTO room_type (room_type_id, hotel_id, room_type_name, room_type_base_price)
SELECT 
  gen_random_uuid(),
  hotel_id,
  rt.name,
  rt.price
FROM hotels,
LATERAL (
  VALUES
    ('Standard Room', 800000),
    ('Deluxe Room', 1500000),
    ('Suite Room', 3000000)
) AS rt(name, price);

-- =========================
-- ROOMS
-- =========================
INSERT INTO rooms (room_id, room_type_id, name, floor, number, capacity)
SELECT
  gen_random_uuid(),
  room_type_id,
  'Room ' || floor || number,
  floor,
  number,
  2
FROM room_type,
LATERAL (
  SELECT floor, number
  FROM generate_series(1,3) AS floor,
       generate_series(1,3) AS number
) t;

-- =========================
-- SERVICES
-- =========================
INSERT INTO services (service_id, hotel_id, service_name, service_price, pricing_type)
SELECT
  gen_random_uuid(),
  hotel_id,
  s.name,
  s.price,
  'per_use'
FROM hotels,
LATERAL (
  VALUES
    ('Spa', 500000),
    ('Airport Pickup', 300000),
    ('Breakfast Buffet', 200000)
) s(name, price);

-- =========================
-- AMENITIES
-- =========================


-- =========================
-- BOOKING
-- =========================
INSERT INTO booking (id, user_id, check_in, check_out, total_amount, status)
SELECT
  gen_random_uuid(),
  u.user_id,
  CURRENT_DATE + INTERVAL '3 day',
  CURRENT_DATE + INTERVAL '5 day',
  3000000,
  'Confirmed'
FROM "User" u
LIMIT 3;

-- =========================
-- BOOKING DETAIL
-- =========================
INSERT INTO booking_detail (id, booking_id, room_id, price_at_booking)
SELECT
  gen_random_uuid(),
  b.id,
  r.room_id,
  1500000
FROM booking b
JOIN rooms r ON TRUE
LIMIT 3;

-- =========================
-- PAYMENT
-- =========================
INSERT INTO payment (id, booking_id, amount, payment_method, status)
SELECT
  gen_random_uuid(),
  b.id,
  b.total_amount,
  'Credit Card',
  'Paid'
FROM booking b;

-- =========================
-- SEASONAL PRICING
-- =========================
INSERT INTO seasonalpricing (season_id, hotel_id, start_date, end_date, multiplier)
SELECT
  gen_random_uuid(),
  hotel_id,
  '2026-06-01',
  '2026-08-31',
  1.5
FROM hotels;

-- =========================
-- SPECIAL DATE PRICING
-- =========================
INSERT INTO specialdatepricing (id, room_type_id, specific_date, specific_rate)
SELECT
  gen_random_uuid(),
  room_type_id,
  '2026-12-31',
  2.0
FROM room_type;

