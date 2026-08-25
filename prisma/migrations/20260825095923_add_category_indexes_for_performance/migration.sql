-- DropIndex
DROP INDEX "DailySummary_date_categoryType_idx";

-- DropIndex
DROP INDEX "Streamer_channelName_trgm_idx";

-- DropIndex
DROP INDEX "StreamerDailySummary_channelId_date_idx";

-- DropIndex
DROP INDEX "StreamerDailySummary_date_liveCategory_idx";

-- CreateIndex
CREATE INDEX "DailySummary_liveCategory_categoryType_date_idx" ON "DailySummary"("liveCategory", "categoryType", "date");

-- CreateIndex
CREATE INDEX "StreamerDailySummary_liveCategory_categoryType_maxViewers_idx" ON "StreamerDailySummary"("liveCategory", "categoryType", "maxViewers");

-- CreateIndex
CREATE INDEX "StreamerDailySummary_liveCategory_categoryType_date_idx" ON "StreamerDailySummary"("liveCategory", "categoryType", "date");
