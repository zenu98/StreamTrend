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
export async function getWeeklyTopGames() {
  "use cache";
  cacheLife("statsTime");

  const from = getPeriodFrom("weekly");

  const [rows, categories] = await Promise.all([
    prisma.dailySummary.findMany({
      where: { date: { gte: from }, categoryType: "GAME" },
    }),
    prisma.category.findMany({
      select: { categoryId: true, posterImageUrl: true },
    }),
  ]);

  const categoryMap = new Map<
    string,
    {
      liveCategory: string;
      liveCategoryValue: string;
      totalViewers: number;
      snapshotCount: number;
      maxViewers: number;
      peakViewers: number;
    }
  >();

  for (const row of rows) {
    const prev = categoryMap.get(row.liveCategoryValue) ?? {
      liveCategory: row.liveCategory,
      liveCategoryValue: row.liveCategoryValue,
      totalViewers: 0,
      snapshotCount: 0,
      maxViewers: 0,
      peakViewers: 0,
    };
    categoryMap.set(row.liveCategoryValue, {
      ...prev,
      totalViewers: prev.totalViewers + row.totalViewers,
      snapshotCount: prev.snapshotCount + row.snapshotCount,
      maxViewers: Math.max(prev.maxViewers, row.maxViewers),
      peakViewers: Math.max(prev.peakViewers, row.peakViewers),
    });
  }

  const posterMap = new Map(
    categories.map((c) => [c.categoryId, c.posterImageUrl]),
  );

  const allGames = [...categoryMap.values()].map((d) => ({
    category: d.liveCategoryValue,
    categoryId: d.liveCategory,
    concurrentViewers:
      d.snapshotCount > 0 ? Math.round(d.totalViewers / d.snapshotCount) : 0,
    maxViewers: d.maxViewers,
    peakViewers: d.peakViewers,
    posterImageUrl: posterMap.get(d.liveCategory) ?? null,
  }));

  // 평균시청자 기준 상위 10개로 스트리머 조회
  const top10ByConcurrent = [...allGames]
    .sort((a, b) => b.concurrentViewers - a.concurrentViewers)
    .slice(0, 11);

  const top10ByMax = [...allGames]
    .sort((a, b) => b.maxViewers - a.maxViewers)
    .slice(0, 11);

  const top10ByPeak = [...allGames]
    .sort((a, b) => b.peakViewers - a.peakViewers)
    .slice(0, 11);

  // 전체 unique 게임 ID
  const allTop10Ids = [
    ...new Set([
      ...top10ByConcurrent.map((g) => g.categoryId),
      ...top10ByMax.map((g) => g.categoryId),
      ...top10ByPeak.map((g) => g.categoryId),
    ]),
  ];

  const streamerResults = await Promise.all(
    allTop10Ids.map((categoryId) =>
      prisma.streamerDailySummary.findFirst({
        where: {
          date: { gte: from },
          categoryType: "GAME",
          liveCategory: categoryId,
        },
        select: {
          channelId: true,
          channelName: true,
          channelImageUrl: true,
          maxViewers: true,
        },
        orderBy: { maxViewers: "desc" },
      }),
    ),
  );

  const streamerMap = new Map(
    allTop10Ids.map((id, i) => [
      id,
      streamerResults[i]
        ? {
            channelId: streamerResults[i]!.channelId,
            channelName: streamerResults[i]!.channelName,
            channelImageUrl: streamerResults[i]!.channelImageUrl ?? null,
            maxViewers: streamerResults[i]!.maxViewers,
          }
        : null,
    ]),
  );

  const addStreamer = (games: typeof top10ByConcurrent) =>
    games.map((game) => ({
      ...game,
      topStreamer: streamerMap.get(game.categoryId) ?? null,
    }));

  return {
    byConcurrent: addStreamer(top10ByConcurrent),
    byMax: addStreamer(top10ByMax),
    byPeak: addStreamer(top10ByPeak),
  };
}

export async function getWeeklyTopStreamers() {
  "use cache";
  cacheLife("statsTime");

  const from = getPeriodFrom("weekly");

  // 스트리머별 집계 + 게임별 집계 동시에
  const [rows, allGameRows] = await Promise.all([
    prisma.streamerDailySummary.groupBy({
      by: ["channelId", "channelName", "channelImageUrl"],
      where: { date: { gte: from } },
      _sum: {
        totalViewers: true,
        broadcastCount: true,
      },
      _max: {
        maxViewers: true,
      },
    }),
    prisma.streamerDailySummary.groupBy({
      by: ["channelId", "liveCategoryValue"],
      where: { date: { gte: from } },
      _sum: {
        totalViewers: true,
      },
    }),
  ]);

  // channelImageUrl 변경으로 인한 중복 제거
  const deduped = new Map<string, (typeof rows)[0]>();
  for (const row of rows) {
    const existing = deduped.get(row.channelId);
    if (
      !existing ||
      (row._max.maxViewers ?? 0) > (existing._max.maxViewers ?? 0)
    ) {
      deduped.set(row.channelId, row);
    }
  }

  // 평균 시청자 기준 상위 10명
  const top10 = [...deduped.values()]
    .sort((a, b) => {
      const avgA = (a._sum.totalViewers ?? 0) / (a._sum.broadcastCount ?? 1);
      const avgB = (b._sum.totalViewers ?? 0) / (b._sum.broadcastCount ?? 1);
      return avgB - avgA;
    })
    .slice(0, 10);

  const top10Ids = new Set(top10.map((s) => s.channelId));

  // 스트리머별 상위 3게임
  const gameMap = new Map<string, { game: string; viewers: number }[]>();
  for (const row of allGameRows) {
    if (!top10Ids.has(row.channelId)) continue;
    const list = gameMap.get(row.channelId) ?? [];
    list.push({
      game: row.liveCategoryValue,
      viewers: row._sum.totalViewers ?? 0,
    });
    gameMap.set(row.channelId, list);
  }

  return top10.map((s) => ({
    channelId: s.channelId,
    channelName: s.channelName,
    channelImageUrl: s.channelImageUrl ?? null,
    totalViewers: s._sum.totalViewers ?? 0,
    maxViewers: s._max.maxViewers ?? 0,
    broadcastCount: s._sum.broadcastCount ?? 0,
    topGames: (gameMap.get(s.channelId) ?? [])
      .sort((a, b) => b.viewers - a.viewers)
      .slice(0, 3)
      .map((g) => g.game),
  }));
}
