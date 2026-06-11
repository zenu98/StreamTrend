-- CreateTable
CREATE TABLE "DailySummary" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "liveCategory" TEXT NOT NULL,
    "liveCategoryValue" TEXT NOT NULL,
    "totalViewers" INTEGER NOT NULL,
    "broadcastCount" INTEGER NOT NULL,
    "avgViewers" INTEGER NOT NULL,

    CONSTRAINT "DailySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailySummary_date_liveCategoryValue_key" ON "DailySummary"("date", "liveCategoryValue");
