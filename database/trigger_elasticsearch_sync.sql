-- Automatic Elasticsearch Sync (PostgreSQL)
-- Business case:
-- - hotel update
-- - room update
-- - price update (daily_rates)
-- => enqueue job to sync Elasticsearch

CREATE TABLE IF NOT EXISTS public.es_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(30) NOT NULL,      -- HOTEL | ROOM | PRICE
  entity_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL DEFAULT 'UPDATE',
  payload JSONB NOT NULL,
  sync_status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING | PROCESSING | DONE | FAILED
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_es_sync_queue_pending
  ON public.es_sync_queue (sync_status, created_at);

CREATE INDEX IF NOT EXISTS idx_es_sync_queue_entity
  ON public.es_sync_queue (entity_type, entity_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.fn_enqueue_es_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_entity_type VARCHAR(30);
  v_entity_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'hotels' THEN
    v_entity_type := 'HOTEL';
    v_entity_id := NEW.id;
  ELSIF TG_TABLE_NAME = 'rooms' THEN
    v_entity_type := 'ROOM';
    v_entity_id := NEW.id;
  ELSIF TG_TABLE_NAME = 'daily_rates' THEN
    v_entity_type := 'PRICE';
    v_entity_id := NEW.id;
  ELSE
    RAISE EXCEPTION 'Unsupported table for ES sync trigger: %', TG_TABLE_NAME;
  END IF;

  INSERT INTO public.es_sync_queue (
    entity_type,
    entity_id,
    action,
    payload
  )
  VALUES (
    v_entity_type,
    v_entity_id,
    TG_OP,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'updated_at', NOW(),
      'new_data', to_jsonb(NEW)
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_es_sync_hotels_update ON public.hotels;
CREATE TRIGGER trg_es_sync_hotels_update
AFTER UPDATE ON public.hotels
FOR EACH ROW
WHEN (OLD IS DISTINCT FROM NEW) 
EXECUTE FUNCTION public.fn_enqueue_es_sync();

DROP TRIGGER IF EXISTS trg_es_sync_rooms_update ON public.rooms;
CREATE TRIGGER trg_es_sync_rooms_update
AFTER UPDATE ON public.rooms
FOR EACH ROW
WHEN (OLD IS DISTINCT FROM NEW)
EXECUTE FUNCTION public.fn_enqueue_es_sync();

DROP TRIGGER IF EXISTS trg_es_sync_daily_rates_update ON public.daily_rates;
CREATE TRIGGER trg_es_sync_daily_rates_update
AFTER UPDATE ON public.daily_rates
FOR EACH ROW
WHEN (OLD IS DISTINCT FROM NEW)
EXECUTE FUNCTION public.fn_enqueue_es_sync();

