import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";
import { getLives } from "./lives";
import { toKSTDateString } from "./utils";

export async function getGameCategoryInfo(categoryId: string) {
  "use cache";
  cacheLife("statsTime");
  return prisma.category.findUnique({ where: { categoryId } });
}

export async function getGameLiveStats(categoryId: string) {
  "use cache";
  cacheLife("statsTime");

  const lives = await getLives();

  const currentGame = lives.allGames.find((g) => g.categoryId === categoryId);
  const currentViewers = currentGame?.totalViewers ?? 0;
  const currentCount = currentGame?.count ?? 0;

  const viewerRank = [...lives.allGames]
    .sort((a, b) => b.totalViewers - a.totalViewers)
    .findIndex((g) => g.categoryId === categoryId);
  const viewerTier =
    viewerRank <= 9
      ? "S"
      : viewerRank <= 19
        ? "A"
        : viewerRank <= 29
          ? "B"
          : "C";

  const countRank = [...lives.allGames]
    .sort((a, b) => b.count - a.count)
    .findIndex((g) => g.categoryId === categoryId);
  const countTier =
    countRank <= 9 ? "S" : countRank <= 19 ? "A" : countRank <= 29 ? "B" : "C";

  const currentMaxViewer = lives.allGamesRaw
    .filter((live: any) => live.liveCategory === categoryId)
    .reduce(
      (max: any, live: any) =>
        live.concurrentUserCount > (max?.concurrentUserCount ?? 0) ? live : max,
      null,
    );

  return {
    currentViewers,
    currentCount,
    viewerTier,
    countTier,
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

  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kstNow.setUTCHours(0, 0, 0, 0);

  const fromYear = new Date(
    Date.UTC(kstNow.getUTCFullYear(), 0, 1) - 9 * 60 * 60 * 1000,
  );

  const rows = await prisma.dailySummary.findMany({
    where: { liveCategory: categoryId, date: { gte: fromYear } },
    orderBy: { date: "asc" },
  });

  const maxViewers =
    rows.length > 0 ? Math.max(...rows.map((r) => r.maxViewers)) : 0;
  const peakViewers =
    rows.length > 0 ? Math.max(...rows.map((r) => r.peakViewers)) : 0;

  const allTimeTopStreamer = await prisma.streamerDailySummary.findFirst({
    where: { liveCategory: categoryId },
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

  return {
    maxViewers,
    peakViewers,
    allTimeTopStreamer,
    allRows,
  };
}
