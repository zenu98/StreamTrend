CREATE INDEX IF NOT EXISTS "DailySummary_date_categoryType_idx" ON "DailySummary"("date", "categoryType");
CREATE INDEX IF NOT EXISTS "StreamerDailySummary_channelId_date_idx" ON "StreamerDailySummary"("channelId", "date");
CREATE INDEX IF NOT EXISTS "StreamerDailySummary_date_liveCategory_idx" ON "StreamerDailySummary"("date", "liveCategory");

DROP INDEX IF EXISTS "Streamer_channelName_trgm_idx";
CREATE INDEX IF NOT EXISTS "Streamer_channelName_idx" ON "Streamer"("channelName");
