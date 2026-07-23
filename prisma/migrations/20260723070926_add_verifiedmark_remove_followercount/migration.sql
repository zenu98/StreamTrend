/*
  Warnings:

  - You are about to drop the column `followerCount` on the `Streamer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Streamer" DROP COLUMN "followerCount",
ADD COLUMN     "verifiedMark" BOOLEAN NOT NULL DEFAULT false;
