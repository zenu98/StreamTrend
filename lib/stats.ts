import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";
export async function getStatsByDate(period: "weekly" | "monthly") {
  "use cache";
  cacheLife("statsTime");

  const from = getPeriodFrom(period);

  const rows = await prisma.dailySummary.findMany({
    where: { date: { gte: from }, categoryType: "GAME" },
    orderBy: { date: "asc" },
  });

  // 오늘 LiveSnapshot 조회
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const kstHour = kstNow.getUTCHours();
  const todayFrom =
    kstHour >= 6
      ? new Date(
          Date.UTC(
            kstNow.getUTCFullYear(),
            kstNow.getUTCMonth(),
            kstNow.getUTCDate(),
            6 - 9,
            0,
            0,
          ),
        ) // KST 06:00 = UTC 21:00 전날
      : new Date(
          Date.UTC(
            kstNow.getUTCFullYear(),
            kstNow.getUTCMonth(),
            kstNow.getUTCDate() - 1,
            6 - 9,
            0,
            0,
          ),
        );

  // 오늘 날짜 (KST 06:00 기준)
  const todayKSTDate =
    kstHour >= 6
      ? new Date(
          kstNow.getUTCFullYear(),
          kstNow.getUTCMonth(),
          kstNow.getUTCDate(),
        )
      : new Date(
          kstNow.getUTCFullYear(),
          kstNow.getUTCMonth(),
          kstNow.getUTCDate() - 1,
        );
  const todayDate = `${String(todayKSTDate.getMonth() + 1).padStart(2, "0")}-${String(todayKSTDate.getDate()).padStart(2, "0")}`;

  const todaySnaps = await prisma.liveSnapshot.findMany({
    where: {
      collectedAt: { gte: todayFrom },
      categoryType: "GAME",
    },
  });

  // 오늘 게임별 집계
  const todayMap = new Map<
    string,
    { totalViewers: number; snapshotCount: number }
  >();
  const todayCollectedAts = new Set(
    todaySnaps.map((s) => s.collectedAt.getTime()),
  );
  const todaySnapshotCount = todayCollectedAts.size;

  for (const snap of todaySnaps) {
    if (!snap.liveCategoryValue) continue;
    const prev = todayMap.get(snap.liveCategoryValue) ?? {
      totalViewers: 0,
      snapshotCount: 0,
    };
    todayMap.set(snap.liveCategoryValue, {
      totalViewers: prev.totalViewers + snap.concurrentUserCount,
      snapshotCount: todaySnapshotCount,
    });
  }

  // 게임별로 날짜-시청자 데이터 구조화
  const gameMap = new Map<string, Map<string, number>>();

  for (const row of rows) {
    const date = new Date(row.date.getTime() + 9 * 60 * 60 * 1000)
      .toISOString()
      .slice(5, 10);
    const concurrentViewers =
      row.snapshotCount > 0
        ? Math.round(row.totalViewers / row.snapshotCount)
        : 0;

    if (!gameMap.has(row.liveCategoryValue)) {
      gameMap.set(row.liveCategoryValue, new Map());
    }
    gameMap.get(row.liveCategoryValue)!.set(date, concurrentViewers);
  }

  // 오늘 데이터 추가
  for (const [game, data] of todayMap.entries()) {
    if (!gameMap.has(game)) gameMap.set(game, new Map());
    gameMap
      .get(game)!
      .set(
        todayDate,
        data.snapshotCount > 0
          ? Math.round(data.totalViewers / data.snapshotCount)
          : 0,
      );
  }

  // 전체 날짜 목록
  const allDates = [
    ...new Set([
      ...rows.map((r) =>
        new Date(r.date.getTime() + 9 * 60 * 60 * 1000)
          .toISOString()
          .slice(5, 10),
      ),
      todayDate,
    ]),
  ].sort();

  const gameTotals = Array.from(gameMap.entries())
    .map(([game, dateMap]) => ({
      game,
      total: Array.from(dateMap.values()).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    dates: allDates,
    games: gameTotals.map(({ game }) => ({
      game,
      data: allDates.map((date) => ({
        date,
        value: gameMap.get(game)?.get(date) ?? 0,
      })),
    })),
  };
}
export function getPeriodFrom(period: "daily" | "weekly" | "monthly"): Date {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kstNow.setUTCHours(0, 0, 0, 0);
  const todayKSTasUTC = new Date(kstNow.getTime() - 9 * 60 * 60 * 1000);

  if (period === "daily") {
    const from = new Date(todayKSTasUTC);
    from.setUTCDate(from.getUTCDate() - 1);
    return from;
  }
  if (period === "weekly") {
    const from = new Date(todayKSTasUTC);
    from.setUTCDate(from.getUTCDate() - 7);
    return from;
  }
  const from = new Date(todayKSTasUTC);
  from.setUTCDate(from.getUTCDate() - 30);
  return from;
}

export async function getStats(period: "daily" | "weekly" | "monthly") {
  "use cache";
  cacheLife("statsTime");

  const from = getPeriodFrom(period);

  const rows = await prisma.dailySummary.findMany({
    where: { date: { gte: from }, categoryType: "GAME" },
  });

  const liveCategoryIds = [...new Set(rows.map((r) => r.liveCategory))];
  const categories = await prisma.category.findMany({
    where: { categoryId: { in: liveCategoryIds } },
    select: { categoryId: true, posterImageUrl: true },
  });
  const posterMap = new Map(
    categories.map((c) => [c.categoryId, c.posterImageUrl]),
  );

  const categoryMap = new Map<
    string,
    {
      liveCategory: string;
      liveCategoryValue: string;
      totalViewers: number;
      broadcastCount: number;
      snapshotCount: number;
      maxViewers: number;
      peakViewers: number;
      posterImageUrl: string | null;
    }
  >();

  for (const row of rows) {
    const prev = categoryMap.get(row.liveCategoryValue) ?? {
      liveCategory: row.liveCategory,
      liveCategoryValue: row.liveCategoryValue,
      totalViewers: 0,
      broadcastCount: 0,
      snapshotCount: 0,
      maxViewers: 0,
      peakViewers: 0,
      posterImageUrl: posterMap.get(row.liveCategory) ?? null,
    };
    categoryMap.set(row.liveCategoryValue, {
      ...prev,
      totalViewers: prev.totalViewers + row.totalViewers,
      broadcastCount: prev.broadcastCount + row.broadcastCount,
      snapshotCount: prev.snapshotCount + row.snapshotCount,
      maxViewers: Math.max(prev.maxViewers, row.maxViewers),
      peakViewers: Math.max(prev.peakViewers, row.peakViewers),
    });
  }

  const result = Array.from(categoryMap.values()).map((d) => ({
    category: d.liveCategoryValue,
    categoryId: d.liveCategory,
    totalViewers: d.totalViewers,
    count:
      d.snapshotCount > 0
        ? Math.round(d.broadcastCount / d.snapshotCount)
        : d.broadcastCount,
    avgViewers: Math.round(d.totalViewers / d.broadcastCount),
    concurrentViewers:
      d.snapshotCount > 0 ? Math.round(d.totalViewers / d.snapshotCount) : 0,
    maxViewers: d.maxViewers,
    peakViewers: d.peakViewers,
    posterImageUrl: d.posterImageUrl,
  }));

  return {
    byConcurrentViewers: [...result]
      .sort((a, b) => b.concurrentViewers - a.concurrentViewers)
      .slice(0, 10),
    byViewers: [...result]
      .sort((a, b) => b.avgViewers - a.avgViewers)
      .slice(0, 10),
    byCount: [...result].sort((a, b) => b.count - a.count).slice(0, 10),
    byMaxViewers: [...result]
      .sort((a, b) => b.maxViewers - a.maxViewers)
      .slice(0, 10),
    byPeakViewers: [...result]
      .sort((a, b) => b.peakViewers - a.peakViewers)
      .slice(0, 10),
  };
}
