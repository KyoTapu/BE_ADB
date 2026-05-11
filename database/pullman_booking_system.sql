CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  country VARCHAR(100),
  city VARCHAR(100),
  district VARCHAR(100),
  address TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  star_rating INTEGER,
  timezone VARCHAR(100),
  checkin_time TIME,
  checkout_time TIME,
  total_rooms INTEGER DEFAULT 0,
  status VARCHAR(30) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id),
  code VARCHAR(30),
  name VARCHAR(255),
  description TEXT,
  room_size INTEGER,
  max_adults INTEGER,
  max_children INTEGER,
  bed_type VARCHAR(100),
  smoking_allowed BOOLEAN DEFAULT FALSE,
  base_price DECIMAL(12, 2),
  total_inventory INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id),
  room_type_id UUID NOT NULL REFERENCES public.room_types(id),
  room_number VARCHAR(20),
  floor_number INTEGER,
  room_status VARCHAR(30) DEFAULT 'AVAILABLE',
  housekeeping_status VARCHAR(30) DEFAULT 'CLEAN',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE,
  name VARCHAR(255),
  icon VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.room_type_amenities (
  room_type_id UUID REFERENCES public.room_types(id),
  amenity_id UUID REFERENCES public.amenities(id),
  PRIMARY KEY (room_type_id, amenity_id)
);

CREATE TABLE IF NOT EXISTS public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id),
  code VARCHAR(50),
  name VARCHAR(255),
  description TEXT,
  facility_type VARCHAR(50),
  price_type VARCHAR(30),
  base_price DECIMAL(12, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.room_type_facilities (
  room_type_id UUID REFERENCES public.room_types(id),
  facility_id UUID REFERENCES public.facilities(id),
  included BOOLEAN DEFAULT FALSE,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  PRIMARY KEY (room_type_id, facility_id)
);

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(30),
  nationality VARCHAR(100),
  loyalty_tier VARCHAR(30),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rate_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hotels(id),
  code VARCHAR(50),
  name VARCHAR(255),
  refundable BOOLEAN DEFAULT TRUE,
  cancellation_policy TEXT,
  meal_plan VARCHAR(50),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hotels(id),
  room_type_id UUID REFERENCES public.room_types(id),
  inventory_date DATE,
  total_inventory INTEGER,
  sold_inventory INTEGER DEFAULT 0,
  available_inventory INTEGER,
  stop_sell BOOLEAN DEFAULT FALSE,
  closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (room_type_id, inventory_date)
);

CREATE TABLE IF NOT EXISTS public.daily_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hotels(id),
  room_type_id UUID REFERENCES public.room_types(id),
  rate_plan_id UUID REFERENCES public.rate_plans(id),
  rate_date DATE,
  base_rate DECIMAL(12, 2),
  occupancy_factor DECIMAL(5, 2),
  season_factor DECIMAL(5, 2),
  weekend_factor DECIMAL(5, 2),
  event_factor DECIMAL(5, 2),
  demand_factor DECIMAL(5, 2),
  final_rate DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  stop_sell BOOLEAN DEFAULT FALSE,
  closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (room_type_id, rate_plan_id, rate_date)
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number VARCHAR(50) UNIQUE,
  hotel_id UUID REFERENCES public.hotels(id),
  customer_id UUID REFERENCES public.customers(id),
  checkin_date DATE,
  checkout_date DATE,
  total_nights INTEGER,
  subtotal_amount DECIMAL(12, 2),
  discount_amount DECIMAL(12, 2),
  tax_amount DECIMAL(12, 2),
  service_charge_amount DECIMAL(12, 2),
  final_amount DECIMAL(12, 2),
  currency VARCHAR(10),
  booking_status VARCHAR(30),
  payment_status VARCHAR(30),
  source_channel VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id),
  room_type_id UUID REFERENCES public.room_types(id),
  rate_plan_id UUID REFERENCES public.rate_plans(id),
  room_id UUID REFERENCES public.rooms(id),
  quantity INTEGER,
  adults INTEGER,
  children INTEGER,
  nightly_price_total DECIMAL(12, 2),
  los_discount DECIMAL(12, 2),
  total_price DECIMAL(12, 2)
);

CREATE TABLE IF NOT EXISTS public.booking_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id),
  facility_id UUID REFERENCES public.facilities(id),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(12, 2),
  total_price DECIMAL(12, 2)
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id),
  payment_method VARCHAR(50),
  provider VARCHAR(50),
  transaction_id VARCHAR(255),
  amount DECIMAL(12, 2),
  payment_status VARCHAR(30),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE,
  name VARCHAR(255),
  discount_type VARCHAR(30),
  discount_value DECIMAL(12, 2),
  valid_from DATE,
  valid_to DATE,
  usage_limit INTEGER,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.booking_promotions (
  booking_id UUID REFERENCES public.bookings(id),
  promotion_id UUID REFERENCES public.promotions(id),
  PRIMARY KEY (booking_id, promotion_id)
);

CREATE TABLE IF NOT EXISTS public.tax_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(100),
  tax_name VARCHAR(100),
  tax_percent DECIMAL(5, 2),
  active BOOLEAN DEFAULT TRUE
);
