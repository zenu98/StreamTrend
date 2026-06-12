/*
  Warnings:

  - A unique constraint covering the columns `[date,liveCategoryValue,categoryType]` on the table `DailySummary` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "DailySummary_date_liveCategoryValue_key";

-- AlterTable
ALTER TABLE "DailySummary" ADD COLUMN     "categoryType" TEXT NOT NULL DEFAULT 'GAME';

-- AlterTable
ALTER TABLE "StreamerDailySummary" ADD COLUMN     "maxViewers" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "DailySummary_date_liveCategoryValue_categoryType_key" ON "DailySummary"("date", "liveCategoryValue", "categoryType");
