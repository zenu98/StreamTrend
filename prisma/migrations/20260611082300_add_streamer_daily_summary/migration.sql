-- CreateTable
CREATE TABLE "StreamerDailySummary" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "channelImageUrl" TEXT,
    "liveCategory" TEXT NOT NULL,
    "liveCategoryValue" TEXT NOT NULL,
    "totalViewers" INTEGER NOT NULL,
    "broadcastCount" INTEGER NOT NULL,
    "avgViewers" INTEGER NOT NULL,

    CONSTRAINT "StreamerDailySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StreamerDailySummary_channelId_date_idx" ON "StreamerDailySummary"("channelId", "date");

-- CreateIndex
CREATE INDEX "StreamerDailySummary_date_liveCategory_idx" ON "StreamerDailySummary"("date", "liveCategory");

-- CreateIndex
CREATE UNIQUE INDEX "StreamerDailySummary_date_channelId_liveCategory_key" ON "StreamerDailySummary"("date", "channelId", "liveCategory");
