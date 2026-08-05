import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";
import { toKSTDateString } from "./utils";
import { BROADCAST_CHANNEL_IDS, getLives } from "./lives";
export async function getStatsByDate(period: "weekly" | "monthly") {
  "use cache";
  cacheLife("statsTime");

  const from = getPeriodFrom(period);

  const rows = await prisma.dailySummary.findMany({
    where: { date: { gte: from } },
    orderBy: { date: "asc" },
  });

  const gameMap = new Map<
    string,
    Map<
      string,
      { concurrentViewers: number; maxViewers: number; peakViewers: number }
    >
  >();

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
    gameMap.get(row.liveCategoryValue)!.set(date, {
      concurrentViewers,
      maxViewers: row.maxViewers,
      peakViewers: row.peakViewers,
    });
  }

  const allDates = [
    ...new Set(
      rows.map((r) =>
        new Date(r.date.getTime() + 9 * 60 * 60 * 1000)
          .toISOString()
          .slice(5, 10),
      ),
    ),
  ].sort();

  const gameTotals = Array.from(gameMap.entries())
    .map(([game, dateMap]) => ({
      game,
      total: Array.from(dateMap.values()).reduce(
        (a, b) => a + b.concurrentViewers,
        0,
      ),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    dates: allDates,
    games: gameTotals.map(({ game }) => ({
      game,
      data: allDates.map((date) => ({
        date,
        concurrentViewers: gameMap.get(game)?.get(date)?.concurrentViewers ?? 0,
        maxViewers: gameMap.get(game)?.get(date)?.maxViewers ?? 0,
        peakViewers: gameMap.get(game)?.get(date)?.peakViewers ?? 0,
      })),
    })),
  };
}
export function getPeriodFrom(
  period: "daily" | "3days" | "weekly" | "monthly",
): Date {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  if (kstNow.getUTCHours() < 6) {
    kstNow.setUTCDate(kstNow.getUTCDate() - 1);
  }
  kstNow.setUTCHours(0, 0, 0, 0);
  const todayKSTasUTC = new Date(kstNow.getTime() - 9 * 60 * 60 * 1000);

  if (period === "daily") {
    const from = new Date(todayKSTasUTC);
    from.setUTCDate(from.getUTCDate() - 1);
    return from;
  }
  if (period === "3days") {
    const from = new Date(todayKSTasUTC);
    from.setUTCDate(from.getUTCDate() - 3);
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
export async function get3DaysTopGames() {
  "use cache";
  cacheLife("statsTime");

  const from = getPeriodFrom("3days");

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
      broadcastCount: number;
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
      broadcastCount: 0,
    };
    categoryMap.set(row.liveCategoryValue, {
      ...prev,
      totalViewers: prev.totalViewers + row.totalViewers,
      snapshotCount: prev.snapshotCount + row.snapshotCount,
      maxViewers: Math.max(prev.maxViewers, row.maxViewers),
      peakViewers: Math.max(prev.peakViewers, row.peakViewers),
      broadcastCount: prev.broadcastCount + row.broadcastCount,
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
    broadcastCount: d.broadcastCount,
  }));
  const top10ByBroadcast = [...allGames]
    .sort((a, b) => b.broadcastCount - a.broadcastCount)
    .slice(0, 11);
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
    byBroadcast: addStreamer(top10ByBroadcast), // ← 추가
    allGames,
  };
}
export async function get7DaysAllGames() {
  "use cache";
  cacheLife("statsTime");

  const from = getPeriodFrom("weekly");

  const [rows, categories] = await Promise.all([
    prisma.dailySummary.findMany({
      where: { date: { gte: from }, categoryType: "GAME" },
      orderBy: { date: "asc" },
    }),
    prisma.category.findMany({
      select: { categoryId: true, categoryValue: true, posterImageUrl: true },
    }),
  ]);

  const posterMap = new Map(
    categories.map((c) => [
      c.categoryId,
      { posterImageUrl: c.posterImageUrl, categoryValue: c.categoryValue },
    ]),
  );

  const categoryMap = new Map<
    string,
    {
      liveCategory: string;
      liveCategoryValue: string;
      totalViewers: number;
      snapshotCount: number;
      broadcastCount: number;
      dailyViewers: { date: string; concurrentViewers: number }[];
    }
  >();

  for (const row of rows) {
    const prev = categoryMap.get(row.liveCategoryValue) ?? {
      liveCategory: row.liveCategory,
      liveCategoryValue: row.liveCategoryValue,
      totalViewers: 0,
      snapshotCount: 0,
      broadcastCount: 0,
      dailyViewers: [],
    };
    const date = toKSTDateString(row.date);
    const existing = prev.dailyViewers.find((d) => d.date === date);
    if (existing) {
      existing.concurrentViewers +=
        row.snapshotCount > 0
          ? Math.round(row.totalViewers / row.snapshotCount)
          : 0;
    } else {
      prev.dailyViewers.push({
        date,
        concurrentViewers:
          row.snapshotCount > 0
            ? Math.round(row.totalViewers / row.snapshotCount)
            : 0,
      });
    }
    categoryMap.set(row.liveCategoryValue, {
      ...prev,
      totalViewers: prev.totalViewers + row.totalViewers,
      snapshotCount: prev.snapshotCount + row.snapshotCount,
      broadcastCount: prev.broadcastCount + row.broadcastCount,
    });
  }

  const allGames = [...categoryMap.values()].map((d) => ({
    categoryId: d.liveCategory,
    category:
      posterMap.get(d.liveCategory)?.categoryValue ?? d.liveCategoryValue,
    concurrentViewers:
      d.snapshotCount > 0 ? Math.round(d.totalViewers / d.snapshotCount) : 0,
    broadcastCount: d.broadcastCount,
    posterImageUrl: posterMap.get(d.liveCategory)?.posterImageUrl ?? null,
    dailyViewers: d.dailyViewers,
  }));

  const sortedByViewers = [...allGames].sort(
    (a, b) => b.concurrentViewers - a.concurrentViewers,
  );
  const sortedByBroadcast = [...allGames].sort(
    (a, b) => b.broadcastCount - a.broadcastCount,
  );
  const maxViewers =
    sortedByViewers[1]?.concurrentViewers ??
    sortedByViewers[0]?.concurrentViewers ??
    1;
  const maxBroadcast =
    sortedByBroadcast[1]?.broadcastCount ??
    sortedByBroadcast[0]?.broadcastCount ??
    1;
  const firstCategoryId = sortedByViewers[0]?.categoryId;

  const withScore = allGames.map((g) => {
    const isFirst = g.categoryId === firstCategoryId;

    const viewerPercentile = isFirst
      ? 100
      : Math.min(
          98,
          Math.round(
            (Math.sqrt(g.concurrentViewers) / Math.sqrt(maxViewers)) * 100,
          ),
        );
    const countPercentile = isFirst
      ? 100
      : Math.min(
          98,
          Math.round(
            (Math.sqrt(g.broadcastCount) / Math.sqrt(maxBroadcast)) * 100,
          ),
        );

    const days = g.dailyViewers;
    const recent3 = days.slice(-3);
    const prev4 = days.slice(-7, -3);
    const recentAvg =
      recent3.reduce((s, r) => s + r.concurrentViewers, 0) /
      (recent3.length || 1);
    const prevAvg =
      prev4.reduce((s, r) => s + r.concurrentViewers, 0) / (prev4.length || 1);
    const diff = recentAvg - prevAvg;
    const avg = (recentAvg + prevAvg) / 2;
    const changeRate = avg > 0 ? diff / avg : 0;

    const baseScore = isFirst
      ? 100
      : Math.round(viewerPercentile * 0.6 + countPercentile * 0.4);
    const totalScore = isFirst ? 100 : baseScore; // 감점 없음

    return {
      categoryId: g.categoryId,
      category: g.category,
      concurrentViewers: g.concurrentViewers,
      broadcastCount: g.broadcastCount,
      posterImageUrl: g.posterImageUrl,
      totalScore,
      changeRate,
      topStreamer: null,
    };
  });

  const byScore = [...withScore]
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 11);

  return {
    allGames: allGames.map(({ dailyViewers: _, ...rest }) => rest),
    byScore,
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
      where: {
        date: { gte: from },
        channelId: { notIn: [...BROADCAST_CHANNEL_IDS] },
      },
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
      where: {
        date: { gte: from },
        channelId: { notIn: [...BROADCAST_CHANNEL_IDS] },
      },
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

export async function get3DaysTopStreamers() {
  "use cache";
  cacheLife("statsTime");

  const from = getPeriodFrom("3days");

  const [rows, allGameRows] = await Promise.all([
    prisma.streamerDailySummary.groupBy({
      by: ["channelId", "channelName", "channelImageUrl"],
      where: {
        date: { gte: from },
        channelId: { notIn: [...BROADCAST_CHANNEL_IDS] }, // ← 추가
      },
      _sum: { totalViewers: true, broadcastCount: true },
      _max: { maxViewers: true },
    }),
    prisma.streamerDailySummary.groupBy({
      by: ["channelId", "liveCategoryValue"],
      where: {
        date: { gte: from },
        channelId: { notIn: [...BROADCAST_CHANNEL_IDS] }, // ← 추가
      },
      _sum: { totalViewers: true },
    }),
  ]);

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

  const top10 = [...deduped.values()]
    .sort((a, b) => {
      const avgA = (a._sum.totalViewers ?? 0) / (a._sum.broadcastCount ?? 1);
      const avgB = (b._sum.totalViewers ?? 0) / (b._sum.broadcastCount ?? 1);
      return avgB - avgA;
    })
    .slice(0, 10);

  const top10Ids = new Set(top10.map((s) => s.channelId));

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

export type LiveStreamer = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  totalViewers: number;
  maxViewers: number;
  broadcastCount: number;
  topGames: string[];
  liveTitle: string;
};

export async function getLiveStreamers(): Promise<LiveStreamer[]> {
  "use cache";
  cacheLife("statsTime");

  const lives = await getLives();

  const streamerMap = new Map<
    string,
    {
      channelId: string;
      channelName: string;
      channelImageUrl: string | null;
      totalViewers: number;
      liveTitle: string;
      topGames: Map<string, number>;
    }
  >();

  for (const snap of lives.allGamesRaw) {
    const prev = streamerMap.get(snap.channelId) ?? {
      channelId: snap.channelId,
      channelName: snap.channelName,
      channelImageUrl: snap.channelImageUrl ?? null,
      totalViewers: 0,
      liveTitle: snap.liveTitle,
      topGames: new Map(),
    };
    prev.totalViewers += snap.concurrentUserCount;
    if (snap.liveCategoryValue) {
      prev.topGames.set(
        snap.liveCategoryValue,
        (prev.topGames.get(snap.liveCategoryValue) ?? 0) +
          snap.concurrentUserCount,
      );
    }
    streamerMap.set(snap.channelId, prev);
  }

  return [...streamerMap.values()]
    .sort((a, b) => b.totalViewers - a.totalViewers)
    .slice(0, 10)
    .map((s) => ({
      channelId: s.channelId,
      channelName: s.channelName,
      channelImageUrl: s.channelImageUrl,
      totalViewers: s.totalViewers,
      maxViewers: s.totalViewers,
      broadcastCount: 1,
      topGames: [...s.topGames.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([game]) => game),
      liveTitle: s.liveTitle,
    }));
}
// export async function getRisingGames() {
//   "use cache";
//   cacheLife("statsTime");

//   const from = new Date();
//   from.setDate(from.getDate() - 14);

//   const [rows, categories, lives] = await Promise.all([
//     prisma.dailySummary.findMany({
//       where: { date: { gte: from }, categoryType: "GAME" },
//       orderBy: { date: "asc" },
//     }),
//     prisma.category.findMany({
//       select: { categoryId: true, posterImageUrl: true },
//     }),
//     getLives(), // 오늘 실시간 데이터
//   ]);
//   const todayMap = new Map(
//     lives.allGames.map((g) => [g.categoryId, g.avgViewers]),
//   );
//   const posterMap = new Map(
//     categories.map((c) => [c.categoryId, c.posterImageUrl]),
//   );

//   // 게임별로 날짜순 데이터 그룹핑
//   const gameMap = new Map<
//     string,
//     {
//       liveCategoryValue: string;
//       days: { date: string; concurrentViewers: number }[];
//     }
//   >();

//   for (const row of rows) {
//     const prev = gameMap.get(row.liveCategory) ?? {
//       liveCategoryValue: row.liveCategoryValue,
//       days: [],
//     };
//     const date = toKSTDateString(row.date);
//     const existing = prev.days.find((d) => d.date === date);
//     if (existing) {
//       existing.concurrentViewers +=
//         row.snapshotCount > 0
//           ? Math.round(row.totalViewers / row.snapshotCount)
//           : 0;
//     } else {
//       prev.days.push({
//         date,
//         concurrentViewers:
//           row.snapshotCount > 0
//             ? Math.round(row.totalViewers / row.snapshotCount)
//             : 0,
//       });
//     }
//     gameMap.set(row.liveCategory, prev);
//   }

//   const rising: {
//     category: string;
//     categoryId: string;
//     posterImageUrl: string | null;
//     momentumPct: number;
//     recentAvg: number;
//   }[] = [];
//   const today = toKSTDateString(new Date());
//   for (const [categoryId, data] of gameMap.entries()) {
//     const todayViewers = todayMap.get(categoryId);
//     if (todayViewers) {
//       data.days.push({ date: today, concurrentViewers: todayViewers });
//     }
//   }
//   for (const [categoryId, data] of gameMap.entries()) {
//     const days = data.days;
//     if (days.length < 10) continue; // 데이터 부족하면 스킵

//     const values = days.map((d) => d.concurrentViewers);
//     const n = values.length;
//     const recentValues = values.slice(n - 5); // 최근 3일
//     const priorValues = values.slice(0, n - 5); // 이전

//     const recentMean =
//       recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
//     const priorMean =
//       priorValues.reduce((a, b) => a + b, 0) / priorValues.length;
//     const momentumPct =
//       priorMean > 0 ? ((recentMean - priorMean) / priorMean) * 100 : 0;
//     const daysAbovePrior = recentValues.filter((v) => v > priorMean).length;

//     // 급상승 기준: 최근 3일 평균이 이전 대비 20% 이상 증가
//     if (
//       momentumPct >= 30 &&
//       recentMean > 1000 &&
//       values[n - 1] >= recentMean * 0.8 &&
//       daysAbovePrior >= 3
//     ) {
//       rising.push({
//         category: data.liveCategoryValue,
//         categoryId,
//         posterImageUrl: posterMap.get(categoryId) ?? null,
//         momentumPct,
//         recentAvg: Math.round(recentMean),
//       });
//     }
//   }

//   return rising
//     .sort((a, b) => b.momentumPct - a.momentumPct)
//     .slice(0, 11)
//     .map((g) => ({
//       ...g,
//       concurrentViewers: g.recentAvg,
//       maxViewers: g.recentAvg,
//       peakViewers: g.recentAvg,
//       topStreamer: null,
//     }));
// }
