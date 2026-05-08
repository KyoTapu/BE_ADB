BEGIN;

ALTER TABLE amenities
  ADD COLUMN IF NOT EXISTS hotel_id integer,
  ADD COLUMN IF NOT EXISTS amenity_description text,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP;

UPDATE amenities a
SET hotel_id = rt.hotel_id
FROM room_type rt
WHERE a.room_type_id = rt.room_type_id
  AND a.hotel_id IS NULL;

CREATE TABLE IF NOT EXISTS room_type_amenity (
  room_type_id integer NOT NULL,
  amenity_id integer NOT NULL
);

INSERT INTO room_type_amenity (room_type_id, amenity_id)
SELECT DISTINCT room_type_id, amenity_id
FROM amenities
WHERE room_type_id IS NOT NULL;

WITH canonical AS (
  SELECT
    amenity_id,
    MIN(amenity_id) OVER (
      PARTITION BY hotel_id, LOWER(TRIM(amenity_name))
    ) AS keep_id,
    ROW_NUMBER() OVER (
      PARTITION BY hotel_id, LOWER(TRIM(amenity_name))
      ORDER BY amenity_id
    ) AS row_num
  FROM amenities
  WHERE hotel_id IS NOT NULL
)
UPDATE room_type_amenity rta
SET amenity_id = canonical.keep_id
FROM canonical
WHERE rta.amenity_id = canonical.amenity_id;

DELETE FROM room_type_amenity duplicate_rows
USING room_type_amenity keep_rows
WHERE duplicate_rows.ctid < keep_rows.ctid
  AND duplicate_rows.room_type_id = keep_rows.room_type_id
  AND duplicate_rows.amenity_id = keep_rows.amenity_id;

WITH canonical AS (
  SELECT
    amenity_id,
    ROW_NUMBER() OVER (
      PARTITION BY hotel_id, LOWER(TRIM(amenity_name))
      ORDER BY amenity_id
    ) AS row_num
  FROM amenities
  WHERE hotel_id IS NOT NULL
)
DELETE FROM amenities a
USING canonical
WHERE a.amenity_id = canonical.amenity_id
  AND canonical.row_num > 1;

ALTER TABLE room_type_amenity
  ADD CONSTRAINT room_type_amenity_pkey PRIMARY KEY (room_type_id, amenity_id);

ALTER TABLE room_type_amenity
  ADD CONSTRAINT room_type_amenity_room_type_id_fkey
    FOREIGN KEY (room_type_id) REFERENCES room_type(room_type_id) ON DELETE CASCADE,
  ADD CONSTRAINT room_type_amenity_amenity_id_fkey
    FOREIGN KEY (amenity_id) REFERENCES amenities(amenity_id) ON DELETE CASCADE;

ALTER TABLE amenities
  DROP CONSTRAINT IF EXISTS amenities_room_type_id_fkey;

ALTER TABLE amenities
  DROP COLUMN IF EXISTS room_type_id;

ALTER TABLE amenities
  ADD CONSTRAINT amenities_hotel_id_fkey
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_amenities_hotel
  ON amenities(hotel_id);

CREATE INDEX IF NOT EXISTS idx_room_type_amenity_room_type
  ON room_type_amenity(room_type_id);

CREATE INDEX IF NOT EXISTS idx_room_type_amenity_amenity
  ON room_type_amenity(amenity_id);

COMMIT;
