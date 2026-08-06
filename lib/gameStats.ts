import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";
import { getLives } from "./lives";
import { toKSTDateString } from "./utils";

export async function getGameCategoryInfo(categoryId: string) {
  "use cache";
  cacheLife("statsTime");
  return prisma.category.findUnique({ where: { categoryId } });
}
function getRankWithTies<T>(
  items: T[],
  getValue: (item: T) => number,
  target: T,
): number {
  const targetValue = getValue(target);
  // target보다 "진짜로" 더 큰 값을 가진 항목의 개수 = 그게 곧 target의 순위(0-indexed)
  return items.filter((item) => getValue(item) > targetValue).length;
}
export const NON_GAME_CATEGORY_IDS = new Set([
  "talk", // talk
  "music",
  "mukbang",
  "animation",
]);
function countBetter<T>(
  items: T[],
  getValue: (item: T) => number,
  value: number,
): number {
  return items.filter((item) => getValue(item) > value).length;
}
export async function getGameLiveStats(categoryId: string) {
  "use cache";
  cacheLife("statsTime");

  const lives = await getLives();

  const currentGame = lives.allGames.find((g) => g.categoryId === categoryId);
  const currentViewers = currentGame?.totalViewers ?? 0;
  const currentCount = currentGame?.count ?? 0;

  const viewerRank = countBetter(
    lives.allGames,
    (g) => g.totalViewers,
    currentViewers,
  );
  const viewerTier =
    viewerRank <= 9
      ? "S"
      : viewerRank <= 19
        ? "A"
        : viewerRank <= 29
          ? "B"
          : "C";

  const countRank = countBetter(lives.allGames, (g) => g.count, currentCount);
  const countTier =
    countRank <= 9 ? "S" : countRank <= 19 ? "A" : countRank <= 29 ? "B" : "C";

  const totalGames = lives.allGames.length;
  const toTopPercent = (rank: number) =>
    totalGames > 1
      ? Math.min(100, Math.round((rank / (totalGames - 1)) * 100) + 1)
      : 1;
  const viewerPercentile = toTopPercent(viewerRank);
  const countPercentile = toTopPercent(countRank);

  const totalViewersAll = lives.allGames.reduce(
    (sum, g) => sum + g.totalViewers,
    0,
  );
  const totalCountAll = lives.allGames.reduce((sum, g) => sum + g.count, 0);
  const viewerShare =
    totalViewersAll > 0
      ? Math.round((currentViewers / totalViewersAll) * 1000) / 10
      : 0;
  const countShare =
    totalCountAll > 0
      ? Math.round((currentCount / totalCountAll) * 1000) / 10
      : 0;

  // 동점자(같은 시청자 수/방송 수를 가진 카테고리) 개수
  // "142위" 같은 표기가 마치 유일한 등수처럼 보이는 오해를 줄이기 위함
  const viewerTieCount = lives.allGames.filter(
    (g) => g.totalViewers === currentViewers,
  ).length;
  const countTieCount = lives.allGames.filter(
    (g) => g.count === currentCount,
  ).length;

  const currentMaxViewer = lives.allGamesRaw
    .filter((live: any) => live.liveCategory === categoryId)
    .reduce(
      (max: any, live: any) =>
        live.concurrentUserCount > (max?.concurrentUserCount ?? 0) ? live : max,
      null,
    );
  const seen = new Set<string>();
  const topLiveStreamers = lives.allGamesRaw
    .filter((live: any) => live.liveCategory === categoryId)
    .sort((a: any, b: any) => b.concurrentUserCount - a.concurrentUserCount)
    .filter((live: any) => {
      if (seen.has(live.channelId)) return false;
      seen.add(live.channelId);
      return true;
    })
    .slice(0, 3)
    .map((live: any) => ({
      channelId: live.channelId,
      channelName: live.channelName,
      channelImageUrl: live.channelImageUrl ?? null,
      liveThumbnailImageUrl: live.liveThumbnailImageUrl ?? null,
      concurrentUserCount: live.concurrentUserCount,
      liveTitle: live.liveTitle,
    }));
  return {
    topLiveStreamers,
    currentViewers,
    currentCount,
    viewerTier,
    countTier,
    viewerPercentile,
    countPercentile,
    viewerShare,
    countShare,
    viewerRank: viewerRank + 1,
    countRank: countRank + 1,
    viewerTieCount,
    countTieCount,
    totalGames,
    totalCountAll,
    currentMaxViewer: currentMaxViewer
      ? {
          channelId: currentMaxViewer.channelId,
          channelName: currentMaxViewer.channelName,
          channelImageUrl: currentMaxViewer.channelImageUrl ?? null,
          concurrentUserCount: currentMaxViewer.concurrentUserCount,
          liveTitle: currentMaxViewer.liveTitle,
        }
      : null,
  };
}
/**
 * 같은 KST 날짜("MM-DD")로 묶이는 row들을 병합한다.
 * 수동 테스트 등으로 같은 날짜 범위에 summarize가 중복 실행되어
 * DailySummary에 부분 데이터 row가 여러 개 쌓인 경우를 화면 표시 단계에서 흡수하기 위함.
 * DB의 원본 row는 건드리지 않음.
 */
function mergeRowsByKSTDate(
  rows: {
    date: Date;
    totalViewers: number;
    broadcastCount: number;
    snapshotCount: number;
    maxViewers: number;
    peakViewers: number;
  }[],
) {
  const mergedMap = new Map<
    string,
    {
      totalViewers: number;
      broadcastCount: number;
      snapshotCount: number;
      maxViewers: number;
      peakViewers: number;
    }
  >();

  for (const r of rows) {
    const key = toKSTDateString(r.date);
    const prev = mergedMap.get(key);
    mergedMap.set(key, {
      totalViewers: (prev?.totalViewers ?? 0) + r.totalViewers,
      broadcastCount: (prev?.broadcastCount ?? 0) + r.broadcastCount,
      snapshotCount: (prev?.snapshotCount ?? 0) + r.snapshotCount,
      maxViewers: Math.max(prev?.maxViewers ?? 0, r.maxViewers),
      peakViewers: Math.max(prev?.peakViewers ?? 0, r.peakViewers),
    });
  }

  return Array.from(mergedMap.entries())
    .sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0))
    .map(([date, v]) => ({
      date,
      totalViewers: v.totalViewers,
      concurrentViewers:
        v.snapshotCount > 0 ? Math.round(v.totalViewers / v.snapshotCount) : 0,
      broadcastCount:
        v.snapshotCount > 0
          ? Math.round(v.broadcastCount / v.snapshotCount)
          : v.broadcastCount,
      maxViewers: v.maxViewers,
      peakViewers: v.peakViewers,
    }));
}

export async function getGameStats(categoryId: string) {
  "use cache";
  cacheLife("statsTime");
  const isNonGame = NON_GAME_CATEGORY_IDS.has(categoryId);
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  if (kstNow.getUTCHours() < 6) {
    kstNow.setUTCDate(kstNow.getUTCDate() - 1);
  }
  kstNow.setUTCHours(0, 0, 0, 0);

  const fromYear = new Date(
    Date.UTC(kstNow.getUTCFullYear(), 0, 1) - 9 * 60 * 60 * 1000,
  );

  const rows = await prisma.dailySummary.findMany({
    where: {
      liveCategory: categoryId,
      ...(isNonGame ? {} : { categoryType: "GAME" }),
      date: { gte: fromYear },
    },
    orderBy: { date: "asc" },
  });

  const maxViewers =
    rows.length > 0 ? Math.max(...rows.map((r) => r.maxViewers)) : 0;
  const maxViewersRow = rows.find((r) => r.maxViewers === maxViewers);
  const maxViewersDate = maxViewersRow
    ? new Date(maxViewersRow.date.getTime() + 9 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
    : null;

  const peakViewers =
    rows.length > 0 ? Math.max(...rows.map((r) => r.peakViewers)) : 0;

  const allTimeTopStreamer = await prisma.streamerDailySummary.findFirst({
    where: {
      liveCategory: categoryId,
      ...(isNonGame ? {} : { categoryType: "GAME" }),
    },
    orderBy: { maxViewers: "desc" },
    select: {
      channelId: true,
      channelName: true,
      channelImageUrl: true,
      maxViewers: true,
      date: true,
      liveTitle: true,
    },
  });

  const allRows = mergeRowsByKSTDate(rows);

  // 빠진 날짜 0으로 채우기
  const dateSet = new Set(allRows.map((r) => r.date));
  const startDate = new Date(fromYear.getTime() + 9 * 60 * 60 * 1000);
  startDate.setUTCHours(0, 0, 0, 0);

  const filledRows = [...allRows];
  const yesterday = new Date(kstNow.getTime());
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  for (
    let d = new Date(startDate);
    d <= yesterday;
    d.setDate(d.getDate() + 1)
  ) {
    const dateStr = `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    if (!dateSet.has(dateStr)) {
      filledRows.push({
        date: dateStr,
        totalViewers: 0,
        concurrentViewers: 0,
        broadcastCount: 0,
        maxViewers: 0,
        peakViewers: 0,
      });
    }
  }

  filledRows.sort((a, b) => (a.date > b.date ? 1 : -1));
  const streamerRows = await prisma.streamerDailySummary.findMany({
    where: {
      liveCategory: categoryId,
      ...(isNonGame ? {} : { categoryType: "GAME" }),
      date: { gte: fromYear },
    },
    orderBy: { maxViewers: "desc" },
    select: {
      channelId: true,
      channelName: true,
      channelImageUrl: true,
      maxViewers: true,
      date: true,
    },
  });

  const topStreamersByDate = new Map<
    string,
    {
      channelId: string;
      channelName: string;
      channelImageUrl: string | null;
      maxViewers: number;
    }[]
  >();

  for (const r of streamerRows) {
    const date = toKSTDateString(r.date); // "MM-DD" 형식
    const list = topStreamersByDate.get(date) ?? [];
    if (list.length < 3) {
      list.push({
        channelId: r.channelId,
        channelName: r.channelName,
        channelImageUrl: r.channelImageUrl ?? null,
        maxViewers: r.maxViewers,
      });
      topStreamersByDate.set(date, list);
    }
  }

  return {
    isNonGame,
    maxViewers,
    maxViewersDate,
    peakViewers,
    allTimeTopStreamer,
    allRows: filledRows,
    topStreamersByDate: Object.fromEntries(topStreamersByDate),
  };
}
export type TopStreamerEntry = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  maxViewers: number;
  liveTitle: string;
  date: string;
};

function toKSTFullDateString(date: Date): string {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export async function getGameTopStreamers(categoryId: string) {
  "use cache";
  cacheLife("statsTime");

  const topRecordsRaw = await prisma.streamerDailySummary.findMany({
    where: { liveCategory: categoryId },
    orderBy: { maxViewers: "desc" },
    take: 10,
    select: {
      channelId: true,
      channelName: true,
      channelImageUrl: true,
      maxViewers: true,
      liveTitle: true,
      date: true,
    },
  });

  // 채널별 최고 기록만 남긴 뒤 상위 10개 (DISTINCT ON은 Postgres 전용)
  const topChannelsRaw = await prisma.$queryRaw<
    {
      channelId: string;
      channelName: string;
      channelImageUrl: string | null;
      maxViewers: number;
      liveTitle: string;
      date: Date;
    }[]
  >`
    SELECT * FROM (
      SELECT DISTINCT ON ("channelId")
        "channelId", "channelName", "channelImageUrl", "maxViewers", "liveTitle", date
      FROM "StreamerDailySummary"
      WHERE "liveCategory" = ${categoryId}
      ORDER BY "channelId", "maxViewers" DESC
    ) t
    ORDER BY "maxViewers" DESC
    LIMIT 10
  `;

  const toEntry = (r: {
    channelId: string;
    channelName: string;
    channelImageUrl: string | null;
    maxViewers: number;
    liveTitle: string;
    date: Date;
  }): TopStreamerEntry => ({
    channelId: r.channelId,
    channelName: r.channelName,
    channelImageUrl: r.channelImageUrl,
    maxViewers: r.maxViewers,
    liveTitle: r.liveTitle,
    date: toKSTFullDateString(r.date),
  });

  return {
    topRecords: topRecordsRaw.map(toEntry),
    topChannels: topChannelsRaw.map(toEntry),
  };
}
