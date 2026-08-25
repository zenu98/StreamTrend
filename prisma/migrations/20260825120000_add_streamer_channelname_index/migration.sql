CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Streamer_channelName_trgm_idx" ON public."Streamer" USING gin ("channelName" gin_trgm_ops);
