import { prisma } from "@/lib/prisma";
import { getLiveStreamers } from "./stats";

// 경과 시간에 비례해 버킷을 넓혀서, 포인트 개수를 항상 비슷한 범위로 유지
function pickBucketMinutes(elapsedMinutes: number): number {
  if (elapsedMinutes <= 120) return 5;
  if (elapsedMinutes <= 360) return 15;
  if (elapsedMinutes <= 720) return 30;
  return 60;
}

export type TrendPoint = { time: string; [channelId: string]: string | number };

export type TrendStreamer = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  liveTitle?: string | null; // 추가
  categoryValue?: string | null; // 추가
};

export async function getTopStreamersTrend(topN = 5, hours = 6) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - hours * 60 * 60 * 1000);

  const liveStreamers = await getLiveStreamers();
  const top = liveStreamers.slice(0, topN);
  if (top.length === 0) {
    return { points: [], streamers: [], bucketMinutes: 5 };
  }

  const channelIds = top.map((s) => s.channelId);
  const bucketMinutes = 5;
  const bucketSeconds = bucketMinutes * 60;

  // 시계열 (기존과 동일)
  const rows = await prisma.$queryRawUnsafe<
    { bucket: Date; channelId: string; value: number }[]
  >(
    `
      SELECT
        to_timestamp(floor(extract(epoch from "collectedAt") / ${bucketSeconds}) * ${bucketSeconds}) AS bucket,
        "channelId",
        AVG("concurrentUserCount")::float AS value
      FROM "LiveSnapshot"
      WHERE "channelId" = ANY($1::text[])
        AND "collectedAt" >= $2
      GROUP BY bucket, "channelId"
      ORDER BY bucket ASC
    `,
    channelIds,
    windowStart,
  );

  // 각 채널의 "가장 최근 방제목/카테고리" 별도 조회
  const latestInfo = await prisma.$queryRawUnsafe<
    { channelId: string; liveTitle: string; categoryValue: string }[]
  >(
    `
      SELECT DISTINCT ON ("channelId")
        "channelId", "liveTitle", "liveCategoryValue" AS "categoryValue"
      FROM "LiveSnapshot"
      WHERE "channelId" = ANY($1::text[])
      ORDER BY "channelId", "collectedAt" DESC
    `,
    channelIds,
  );
  const infoMap = new Map(latestInfo.map((r) => [r.channelId, r]));

  const byBucket = new Map<string, TrendPoint>();
  for (const row of rows) {
    const key = row.bucket.toISOString();
    const entry = byBucket.get(key) ?? { time: key };
    entry[row.channelId] = Math.round(row.value);
    byBucket.set(key, entry);
  }

  return {
    points: [...byBucket.values()].sort((a, b) => a.time.localeCompare(b.time)),
    streamers: top.map((s) => ({
      channelId: s.channelId,
      channelName: s.channelName,
      channelImageUrl: s.channelImageUrl,
      liveTitle: infoMap.get(s.channelId)?.liveTitle ?? null,
      categoryValue: infoMap.get(s.channelId)?.categoryValue ?? null,
    })),
    bucketMinutes,
  };
}
