-- CreateTable
CREATE TABLE "Streamer" (
    "channelId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "channelImageUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Streamer_pkey" PRIMARY KEY ("channelId")
);
