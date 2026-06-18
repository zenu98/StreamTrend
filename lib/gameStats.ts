import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";
import { getLives } from "./lives";

export async function getGameCategoryInfo(categoryId: string) {
  "use cache";
  cacheLife("statsTime");
  return prisma.category.findUnique({ where: { categoryId } });
}
export async function getGameStats(categoryId: string) {
  "use cache";
  cacheLife("statsTime");

  const lives = await getLives();
  const currentGame = lives.allGames.find((g) => g.categoryId === categoryId);
  const currentViewers = currentGame?.totalViewers ?? 0;
  const currentCount = currentGame?.count ?? 0;

  // 시청자 수 기준 티어
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

  // 방송 수 기준 티어
  const countRank = [...lives.allGames]
    .sort((a, b) => b.count - a.count)
    .findIndex((g) => g.categoryId === categoryId);

  const countTier =
    countRank <= 9 ? "S" : countRank <= 19 ? "A" : countRank <= 29 ? "B" : "C";

  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kstNow.setUTCHours(0, 0, 0, 0);
  const todayKSTasUTC = new Date(kstNow.getTime() - 9 * 60 * 60 * 1000);

  // 최근 30일 (주간/월간 둘 다 커버)
  const from30 = new Date(todayKSTasUTC);
  from30.setUTCDate(from30.getUTCDate() - 30);

  // 연간 (올해 1월 1일부터)
  const fromYear = new Date(
    Date.UTC(kstNow.getUTCFullYear(), 0, 1) - 9 * 60 * 60 * 1000,
  );

  const rows = await prisma.dailySummary.findMany({
    where: {
      liveCategory: categoryId,
      date: { gte: fromYear },
    },
    orderBy: { date: "asc" },
  });

  // 주간: 최근 7일
  const from7 = new Date(todayKSTasUTC);
  from7.setUTCDate(from7.getUTCDate() - 7);
  const weekly = rows
    .filter((r) => r.date >= from7)
    .map((r) => ({
      date: new Date(r.date.getTime() + 9 * 60 * 60 * 1000)
        .toISOString()
        .slice(5, 10), // MM-DD
      totalViewers: r.avgViewers,
      concurrentViewers:
        r.snapshotCount > 0 ? Math.round(r.totalViewers / r.snapshotCount) : 0,
      broadcastCount:
        r.snapshotCount > 0
          ? Math.round(r.broadcastCount / r.snapshotCount)
          : r.broadcastCount,
    }));

  // 월간: 최근 30일
  const monthly = rows
    .filter((r) => r.date >= from30)
    .map((r) => ({
      date: new Date(r.date.getTime() + 9 * 60 * 60 * 1000)
        .toISOString()
        .slice(5, 10),
      totalViewers: r.totalViewers,
      concurrentViewers:
        r.snapshotCount > 0 ? Math.round(r.totalViewers / r.snapshotCount) : 0,
      broadcastCount: r.broadcastCount,
    }));

  // 연간: 월별 합산
  const monthMap = new Map<
    string,
    { totalViewers: number; broadcastCount: number; snapshotCount: number }
  >();
  for (const r of rows) {
    const kstDate = new Date(r.date.getTime() + 9 * 60 * 60 * 1000);
    const key = `${kstDate.getUTCMonth() + 1}월`;
    const prev = monthMap.get(key) ?? {
      totalViewers: 0,
      broadcastCount: 0,
      snapshotCount: 0,
    };
    monthMap.set(key, {
      totalViewers: prev.totalViewers + r.totalViewers,
      broadcastCount: prev.broadcastCount + r.broadcastCount,
      snapshotCount: prev.snapshotCount + r.snapshotCount,
    });
  }
  const yearly = Array.from(monthMap.entries()).map(([month, data]) => ({
    date: month,
    totalViewers: data.totalViewers,
    broadcastCount: data.broadcastCount,
    concurrentViewers:
      data.snapshotCount > 0
        ? Math.round(data.totalViewers / data.snapshotCount)
        : 0,
  }));

  const maxViewers =
    rows.length > 0 ? Math.max(...rows.map((r) => r.maxViewers)) : 0;
  const peakViewers =
    rows.length > 0 ? Math.max(...rows.map((r) => r.peakViewers)) : 0;
  const currentMaxViewer = lives.allGamesRaw
    .filter((live: any) => live.liveCategory === categoryId)
    .reduce(
      (max: any, live: any) =>
        live.concurrentUserCount > (max?.concurrentUserCount ?? 0) ? live : max,
      null,
    );

  const allTimeTopStreamer = await prisma.streamerDailySummary.findFirst({
    where: {
      liveCategory: categoryId,
      categoryType: "GAME",
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
  console.log("categoryId:", categoryId);
  console.log("rows:", rows.length);
  return {
    weekly,
    monthly,
    yearly,
    currentCount,
    currentViewers,
    maxViewers,
    peakViewers,
    currentMaxViewer: currentMaxViewer
      ? {
          channelId: currentMaxViewer.channelId,
          channelName: currentMaxViewer.channelName,
          channelImageUrl: currentMaxViewer.channelImageUrl ?? null,
          concurrentUserCount: currentMaxViewer.concurrentUserCount,
        }
      : null,
    viewerTier,
    countTier,
    allTimeTopStreamer,
  };
}
