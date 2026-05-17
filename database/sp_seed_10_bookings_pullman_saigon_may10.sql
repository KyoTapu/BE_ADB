-- Stored procedure (generalized):
-- Insert N bookings for a given hotel on a given date.
--
-- Usage:
--   \i BE_ADB/database/sp_seed_10_bookings_pullman_saigon_may10.sql
--   CALL public.seed_hotel_bookings_bulk('2026-05-10', 10);
--   CALL public.seed_hotel_bookings_bulk('2026-05-10', 25, 'Pullman Saigon Riverside');
--   -- backward-compatible:
--   CALL public.seed_10_bookings_pullman_saigon_may10();

CREATE OR REPLACE PROCEDURE public.seed_hotel_bookings_bulk(
  IN p_target_date DATE,
  IN p_quantity INTEGER,
  IN p_hotel_name TEXT DEFAULT 'Pullman Saigon Riverside'
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_hotel_id UUID;
  v_hotel_name TEXT := COALESCE(NULLIF(trim(p_hotel_name), ''), 'Pullman Saigon Riverside');
  v_checkout_date DATE := p_target_date + 2;
  v_prefix TEXT;
  v_existing_max INT := 0;
  v_i INT;
  v_seq INT;

  v_room_type_id UUID;
  v_base_price NUMERIC(12,2);
  v_customer_id UUID;

  v_booking_id UUID;
  v_booking_number TEXT;

  v_subtotal NUMERIC(12,2);
  v_discount NUMERIC(12,2);
  v_tax NUMERIC(12,2);
  v_service_charge NUMERIC(12,2);
  v_final NUMERIC(12,2);

  v_booking_status VARCHAR(30);
  v_payment_status VARCHAR(30);
  v_source_channel VARCHAR(50);
  v_payment_method VARCHAR(50);
  v_provider VARCHAR(50);
BEGIN
  IF p_target_date IS NULL THEN
    RAISE EXCEPTION 'p_target_date is required';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'p_quantity must be > 0';
  END IF;

  SELECT h.id
  INTO v_hotel_id
  FROM public.hotels h
  WHERE h.name = v_hotel_name
  LIMIT 1;

  IF v_hotel_id IS NULL THEN
    RAISE EXCEPTION 'Hotel "%" not found in public.hotels', v_hotel_name;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.room_types rt WHERE rt.hotel_id = v_hotel_id) THEN
    RAISE EXCEPTION 'No room_types found for hotel "%"', v_hotel_name;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.customers) THEN
    RAISE EXCEPTION 'No customers found in public.customers';
  END IF;

  v_prefix := upper(regexp_replace(v_hotel_name, '[^A-Za-z0-9]+', '-', 'g'));
  v_prefix := trim(both '-' from v_prefix);
  v_prefix := left(v_prefix, 24) || '-' || to_char(p_target_date, 'YYYYMMDD') || '-';

  SELECT COALESCE(MAX((regexp_match(b.booking_number, '(\d+)$'))[1]::INT), 0)
  INTO v_existing_max
  FROM public.bookings b
  WHERE b.booking_number LIKE v_prefix || '%';

  FOR v_i IN 1..p_quantity LOOP
    v_seq := v_existing_max + v_i;
    v_booking_number := v_prefix || lpad(v_seq::TEXT, 4, '0');

    SELECT rt.id, rt.base_price
    INTO v_room_type_id, v_base_price
    FROM public.room_types rt
    WHERE rt.hotel_id = v_hotel_id
    ORDER BY rt.base_price DESC, rt.name ASC
    OFFSET ((v_seq - 1) % GREATEST((SELECT COUNT(*) FROM public.room_types r2 WHERE r2.hotel_id = v_hotel_id), 1))
    LIMIT 1;

    SELECT c.id
    INTO v_customer_id
    FROM public.customers c
    ORDER BY c.created_at ASC, c.email ASC
    OFFSET ((v_seq - 1) % GREATEST((SELECT COUNT(*) FROM public.customers), 1))
    LIMIT 1;

    v_subtotal := ROUND((COALESCE(v_base_price, 2500000) * 2)::NUMERIC, 2);
    v_discount := ROUND((v_subtotal * (CASE WHEN v_seq % 5 = 0 THEN 0.08 ELSE 0.03 END))::NUMERIC, 2);
    v_tax := ROUND((v_subtotal * 0.10)::NUMERIC, 2);
    v_service_charge := ROUND((v_subtotal * 0.05)::NUMERIC, 2);
    v_final := ROUND((v_subtotal - v_discount + v_tax + v_service_charge)::NUMERIC, 2);

    v_booking_status := CASE
      WHEN v_seq % 7 = 0 THEN 'CANCELLED'
      WHEN v_seq % 4 = 0 THEN 'PENDING'
      ELSE 'CONFIRMED'
    END;

    v_payment_status := CASE
      WHEN v_booking_status = 'CANCELLED' THEN 'REFUNDED'
      WHEN v_seq % 3 = 0 THEN 'PENDING'
      ELSE 'PAID'
    END;

    v_source_channel := CASE
      WHEN v_seq % 4 = 0 THEN 'OTA'
      WHEN v_seq % 3 = 0 THEN 'CORPORATE'
      ELSE 'DIRECT'
    END;

    v_payment_method := CASE
      WHEN v_source_channel = 'CORPORATE' THEN 'bank_transfer'
      WHEN v_source_channel = 'OTA' THEN 'credit_card'
      ELSE 'vnpay'
    END;

    v_provider := CASE
      WHEN v_source_channel = 'OTA' THEN 'stripe'
      WHEN v_source_channel = 'CORPORATE' THEN 'manual'
      ELSE 'vnpay'
    END;

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
    VALUES (
      v_booking_number,
      v_hotel_id,
      v_customer_id,
      p_target_date,
      v_checkout_date,
      2,
      v_subtotal,
      v_discount,
      v_tax,
      v_service_charge,
      v_final,
      'VND',
      v_booking_status,
      v_payment_status,
      v_source_channel,
      NOW() - ((p_quantity - v_i) || ' minutes')::interval
    )
    RETURNING id INTO v_booking_id;

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
    VALUES (
      v_booking_id,
      v_room_type_id,
      NULL,
      NULL,
      1,
      2,
      CASE WHEN v_seq % 5 = 0 THEN 1 ELSE 0 END,
      v_subtotal,
      v_discount,
      ROUND((v_subtotal - v_discount)::NUMERIC, 2)
    );

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
    VALUES (
      v_booking_id,
      v_payment_method,
      v_provider,
      'TXN-' || replace(v_booking_number, '-', ''),
      v_final,
      v_payment_status,
      CASE WHEN v_payment_status = 'PAID' THEN NOW() ELSE NULL END,
      NOW() - ((p_quantity - v_i) || ' minutes')::interval
    );
  END LOOP;
END;
$$;

-- Backward-compatible wrapper: keeps old call pattern.
CREATE OR REPLACE PROCEDURE public.seed_10_bookings_pullman_saigon_may10(
  IN p_target_date DATE DEFAULT DATE '2026-05-10'
)
LANGUAGE plpgsql
AS $$
BEGIN
  CALL public.seed_hotel_bookings_bulk(p_target_date, 10, 'Pullman Saigon Riverside');
END;
$$;
