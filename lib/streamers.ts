import { cacheLife } from "next/cache";
import { prisma } from "@/lib/prisma";
import { MCN_GROUPS, MCNKey } from "@/lib/data/mcn";
import { GROUPS, GroupKey } from "@/lib/data/groups";

const STREAMER_CACHE = { revalidate: 60 * 60 * 24, expire: 60 * 60 * 24 * 7 };

export type Streamer = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  followerCount: number;
  verifiedMark: boolean;
  recentAvgViewers: number;
  topGames: string[];
};

type RawStreamer = Omit<Streamer, "topGames"> & { topGames: string };

function parseTopGames(raw: RawStreamer[]): Streamer[] {
  return raw.map((s) => ({
    ...s,
    topGames: s.topGames ? s.topGames.split("||").filter(Boolean) : [],
  }));
}

// 하루 단위로 고정된 "7일 전" 날짜 문자열. 같은 날 안에서는 항상 동일한 값이라
// 캐시 키가 안정적으로 유지되고, 자정이 지나야만 새로 계산됨.
function sevenDaysAgoDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10); // "2026-09-01"
}

async function getStreamersByNames(
  names: string[],
  agoDateStr: string, // ← 캐시 함수 밖에서 계산된 값을 인자로 받음
): Promise<Streamer[]> {
  if (names.length === 0) return [];
  const ago = new Date(agoDateStr);

  const result = await prisma.$queryRaw<RawStreamer[]>`
    SELECT
      s."channelId",
      s."channelName",
      s."channelImageUrl",
      s."followerCount",
      s."verifiedMark",
      COALESCE(AVG(d."avgViewers"), 0)::int AS "recentAvgViewers",
      COALESCE((
        SELECT STRING_AGG(g."liveCategoryValue", '||' ORDER BY g.cnt DESC)
        FROM (
          SELECT "liveCategoryValue", SUM("broadcastCount") as cnt
          FROM "StreamerDailySummary"
          WHERE "channelId" = s."channelId"
            AND "date" >= ${ago}
            AND "liveCategoryValue" IS NOT NULL
            AND "liveCategoryValue" != ''
          GROUP BY "liveCategoryValue"
          ORDER BY cnt DESC
          LIMIT 3
        ) g
      ), '') AS "topGames"
    FROM "Streamer" s
    LEFT JOIN "StreamerDailySummary" d
      ON s."channelId" = d."channelId"
      AND d."date" >= ${ago}
    WHERE s."channelName" = ANY(${names}::text[])
    GROUP BY s."channelId", s."channelName", s."channelImageUrl", s."followerCount", s."verifiedMark"
    ORDER BY "recentAvgViewers" DESC
  `;
  return parseTopGames(result);
}

export async function getPartnerStreamers(): Promise<Streamer[]> {
  "use cache";
  cacheLife(STREAMER_CACHE);
  const agoDateStr = sevenDaysAgoDateString(); // 캐시 함수 안에서 호출하지만, 결과가 "하루 단위 문자열"이라 사실상 안정적
  const ago = new Date(agoDateStr);

  const result = await prisma.$queryRaw<RawStreamer[]>`
    SELECT
      s."channelId",
      s."channelName",
      s."channelImageUrl",
      s."followerCount",
      s."verifiedMark",
      COALESCE(AVG(d."avgViewers"), 0)::int AS "recentAvgViewers",
      COALESCE((
        SELECT STRING_AGG(g."liveCategoryValue", '||' ORDER BY g.cnt DESC)
        FROM (
          SELECT "liveCategoryValue", SUM("broadcastCount") as cnt
          FROM "StreamerDailySummary"
          WHERE "channelId" = s."channelId"
            AND "date" >= ${ago}
            AND "liveCategoryValue" IS NOT NULL
            AND "liveCategoryValue" != ''
          GROUP BY "liveCategoryValue"
          ORDER BY cnt DESC
          LIMIT 3
        ) g
      ), '') AS "topGames"
    FROM "Streamer" s
    LEFT JOIN "StreamerDailySummary" d
      ON s."channelId" = d."channelId"
      AND d."date" >= ${ago}
    WHERE s."verifiedMark" = true
    GROUP BY s."channelId", s."channelName", s."channelImageUrl", s."followerCount", s."verifiedMark"
    ORDER BY "recentAvgViewers" DESC
  `;
  return parseTopGames(result);
}

export async function getMCNStreamers(mcn: MCNKey): Promise<Streamer[]> {
  "use cache";
  cacheLife(STREAMER_CACHE);
  const agoDateStr = sevenDaysAgoDateString();
  return getStreamersByNames([...MCN_GROUPS[mcn]], agoDateStr);
}

export async function getGroupStreamers(group: GroupKey): Promise<Streamer[]> {
  "use cache";
  cacheLife(STREAMER_CACHE);
  const agoDateStr = sevenDaysAgoDateString();
  return getStreamersByNames([...GROUPS[group]], agoDateStr);
}

export async function getMissingStreamers(mcn: MCNKey) {
  const names = [...MCN_GROUPS[mcn]];
  const found = await prisma.streamer.findMany({
    where: { channelName: { in: names } },
    select: { channelName: true },
  });
  const foundNames = found.map((s) => s.channelName);
  return names.filter((n) => !foundNames.includes(n));
}
