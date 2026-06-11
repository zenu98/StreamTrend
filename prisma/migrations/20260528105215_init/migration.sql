-- CreateTable
CREATE TABLE "LiveSnapshot" (
    "id" SERIAL NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liveId" INTEGER NOT NULL,
    "liveTitle" TEXT NOT NULL,
    "liveThumbnailImageUrl" TEXT,
    "concurrentUserCount" INTEGER NOT NULL,
    "openDate" TEXT NOT NULL,
    "adult" BOOLEAN NOT NULL,
    "tags" TEXT[],
    "categoryType" TEXT NOT NULL,
    "liveCategory" TEXT NOT NULL,
    "liveCategoryValue" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "channelImageUrl" TEXT,

    CONSTRAINT "LiveSnapshot_pkey" PRIMARY KEY ("id")
);
