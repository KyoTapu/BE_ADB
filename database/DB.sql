-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.User (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  full_name character varying,
  email character varying UNIQUE,
  phone character varying,
  password_hash text,
  is_active boolean DEFAULT true,
  is_banned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT User_pkey PRIMARY KEY (user_id)
);
CREATE TABLE public.amenities (
  amenity_id integer NOT NULL DEFAULT nextval('amenities_amenity_id_seq'::regclass),
  hotel_id integer,
  amenity_name character varying,
  amenity_description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT amenities_pkey PRIMARY KEY (amenity_id),
  CONSTRAINT amenities_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(hotel_id)
);
CREATE TABLE public.booking (
  id integer NOT NULL DEFAULT nextval('booking_id_seq'::regclass),
  user_id uuid,
  check_in date NOT NULL,
  check_out date NOT NULL,
  total_amount numeric,
  status character varying DEFAULT 'Pending'::character varying,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  CONSTRAINT booking_pkey PRIMARY KEY (id),
  CONSTRAINT booking_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.User(user_id)
);
CREATE TABLE public.booking_detail (
  id integer NOT NULL DEFAULT nextval('booking_detail_id_seq'::regclass),
  booking_id integer,
  room_id integer,
  price_at_booking numeric,
  count_child integer DEFAULT 0,
  count_parent integer DEFAULT 1,
  CONSTRAINT booking_detail_pkey PRIMARY KEY (id),
  CONSTRAINT booking_detail_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.booking(id),
  CONSTRAINT booking_detail_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(room_id)
);
CREATE TABLE public.country (
  country_id integer NOT NULL DEFAULT nextval('country_country_id_seq'::regclass),
  country_code character varying NOT NULL UNIQUE,
  country_name character varying NOT NULL,
  CONSTRAINT country_pkey PRIMARY KEY (country_id)
);
CREATE TABLE public.hotels (
  hotel_id integer NOT NULL DEFAULT nextval('hotels_hotel_id_seq'::regclass),
  country_id integer,
  hotel_name character varying NOT NULL,
  city_address text,
  star_rating numeric,
  description text,
  timezone character varying DEFAULT 'UTC'::character varying,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT hotels_pkey PRIMARY KEY (hotel_id),
  CONSTRAINT hotels_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.country(country_id)
);
CREATE TABLE public.payment (
  id integer NOT NULL DEFAULT nextval('payment_id_seq'::regclass),
  booking_id integer,
  amount numeric NOT NULL,
  payment_method character varying,
  status character varying,
  paid_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT payment_pkey PRIMARY KEY (id),
  CONSTRAINT payment_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.booking(id)
);
CREATE TABLE public.room_type (
  room_type_id integer NOT NULL DEFAULT nextval('room_type_room_type_id_seq'::regclass),
  hotel_id integer,
  room_type_name character varying NOT NULL,
  room_type_base_price numeric NOT NULL,
  room_type_services text,
  CONSTRAINT room_type_pkey PRIMARY KEY (room_type_id),
  CONSTRAINT room_type_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(hotel_id)
);
CREATE TABLE public.room_type_service (
  room_type_id integer NOT NULL,
  service_id integer NOT NULL,
  CONSTRAINT room_type_service_pkey PRIMARY KEY (room_type_id, service_id),
  CONSTRAINT room_type_service_room_type_id_fkey FOREIGN KEY (room_type_id) REFERENCES public.room_type(room_type_id),
  CONSTRAINT room_type_service_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(service_id)
);
CREATE TABLE public.room_type_amenity (
  room_type_id integer NOT NULL,
  amenity_id integer NOT NULL,
  CONSTRAINT room_type_amenity_pkey PRIMARY KEY (room_type_id, amenity_id),
  CONSTRAINT room_type_amenity_room_type_id_fkey FOREIGN KEY (room_type_id) REFERENCES public.room_type(room_type_id),
  CONSTRAINT room_type_amenity_amenity_id_fkey FOREIGN KEY (amenity_id) REFERENCES public.amenities(amenity_id)
);
CREATE TABLE public.rooms (
  room_id integer NOT NULL DEFAULT nextval('rooms_room_id_seq'::regclass),
  room_type_id integer,
  name character varying,
  floor integer,
  number character varying,
  capacity integer,
  is_available boolean DEFAULT true,
  status character varying DEFAULT 'Available'::character varying,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rooms_pkey PRIMARY KEY (room_id),
  CONSTRAINT rooms_room_type_id_fkey FOREIGN KEY (room_type_id) REFERENCES public.room_type(room_type_id)
);
CREATE TABLE public.seasonalpricing (
  season_id integer NOT NULL DEFAULT nextval('seasonalpricing_season_id_seq'::regclass),
  hotel_id integer,
  start_date date NOT NULL,
  end_date date NOT NULL,
  multiplier numeric NOT NULL,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT seasonalpricing_pkey PRIMARY KEY (season_id),
  CONSTRAINT seasonalpricing_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(hotel_id)
);
CREATE TABLE public.services (
  service_id integer NOT NULL DEFAULT nextval('services_service_id_seq'::regclass),
  hotel_id integer,
  service_name character varying,
  service_price numeric,
  pricing_type character varying,
  CONSTRAINT services_pkey PRIMARY KEY (service_id),
  CONSTRAINT services_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(hotel_id)
);
CREATE TABLE public.specialdatepricing (
  id integer NOT NULL DEFAULT nextval('specialdatepricing_id_seq'::regclass),
  room_type_id integer,
  specific_date date NOT NULL,
  specific_rate numeric,
  specific_note text,
  CONSTRAINT specialdatepricing_pkey PRIMARY KEY (id),
  CONSTRAINT specialdatepricing_room_type_id_fkey FOREIGN KEY (room_type_id) REFERENCES public.room_type(room_type_id)
);
