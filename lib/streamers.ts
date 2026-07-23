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

const sevenDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
};

async function getStreamersByNames(names: string[]): Promise<Streamer[]> {
  if (names.length === 0) return [];
  const ago = sevenDaysAgo();

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
  const ago = sevenDaysAgo();

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
  return getStreamersByNames([...MCN_GROUPS[mcn]]);
}

export async function getGroupStreamers(group: GroupKey): Promise<Streamer[]> {
  "use cache";
  cacheLife(STREAMER_CACHE);
  return getStreamersByNames([...GROUPS[group]]);
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
