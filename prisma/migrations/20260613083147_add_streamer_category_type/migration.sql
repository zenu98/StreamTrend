/*
  Warnings:

  - A unique constraint covering the columns `[date,channelId,liveCategory,categoryType]` on the table `StreamerDailySummary` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "StreamerDailySummary_date_channelId_liveCategory_key";

-- AlterTable
ALTER TABLE "StreamerDailySummary" ADD COLUMN     "categoryType" TEXT NOT NULL DEFAULT 'GAME';

-- CreateIndex
CREATE UNIQUE INDEX "StreamerDailySummary_date_channelId_liveCategory_categoryTy_key" ON "StreamerDailySummary"("date", "channelId", "liveCategory", "categoryType");
