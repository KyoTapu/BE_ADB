-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =========================
-- HOTELS
-- =========================
CREATE INDEX idx_hotels_active 
ON hotels(hotel_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_hotels_name 
ON hotels USING gin (hotel_name gin_trgm_ops);

-- =========================
-- ROOM TYPE
-- =========================
CREATE INDEX idx_room_type_hotel 
ON room_type(hotel_id);

-- =========================
-- ROOMS
-- =========================
CREATE INDEX idx_rooms_room_type 
ON rooms(room_type_id);

-- =========================
-- BOOKING
-- =========================
CREATE INDEX idx_booking_user 
ON booking(user_id);

CREATE INDEX idx_booking_date 
ON booking(check_in, check_out);

CREATE INDEX idx_booking_active 
ON booking(id)
WHERE deleted_at IS NULL;

-- Composite index (rất hữu ích)
CREATE INDEX idx_booking_user_date 
ON booking(user_id, check_in);

-- =========================
-- BOOKING DETAIL
-- =========================
CREATE INDEX idx_booking_detail_booking 
ON booking_detail(booking_id);

CREATE INDEX idx_booking_detail_room 
ON booking_detail(room_id);

-- =========================
-- PAYMENT
-- =========================
CREATE INDEX idx_payment_booking 
ON payment(booking_id);

-- =========================
-- SERVICES
-- =========================
CREATE INDEX idx_services_hotel 
ON services(hotel_id);

-- =========================
-- AMENITIES
-- =========================
CREATE INDEX idx_amenities_room_type 
ON amenities(room_type_id);

-- =========================
-- SEASONAL PRICING
-- =========================
CREATE INDEX idx_seasonal_hotel 
ON seasonalpricing(hotel_id);

-- =========================
-- SPECIAL DATE PRICING
-- =========================
CREATE INDEX idx_special_room_type 
ON specialdatepricing(room_type_id);