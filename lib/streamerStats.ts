import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";
import { toKSTDateString } from "./utils";
function getKSTBusinessDayStart(now: Date): Date {
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const boundary = new Date(kstNow);
  boundary.setUTCHours(6, 0, 0, 0);
  // 06:00 이전이면 아직 전날 영업일이 진행 중
  if (kstNow.getUTCHours() < 6) {
    boundary.setUTCDate(boundary.getUTCDate() - 1);
  }
  return new Date(boundary.getTime() - 9 * 60 * 60 * 1000);
}

export async function getStreamerStats(channelId: string) {
  "use cache";
  cacheLife("statsTime");

  // 당일: LiveSnapshot에서 실시간 조회
  const now = new Date();
  const todayFrom = getKSTBusinessDayStart(now);

  const todaySnapshots = await prisma.liveSnapshot.findMany({
    where: {
      channelId,
      collectedAt: { gte: todayFrom },
    },
    orderBy: { collectedAt: "asc" },
  });

  // 게임별 합산
  const mapToday = new Map<
    string,
    {
      liveCategoryValue: string;
      totalViewers: number;
      broadcastCount: number;
      liveCategory: string;
    }
  >();
  for (const snap of todaySnapshots) {
    const prev = mapToday.get(snap.liveCategory || "unknown") ?? {
      liveCategoryValue: snap.liveCategoryValue || "카테고리 없음",
      liveCategory: snap.liveCategory || "unknown",
      totalViewers: 0,
      broadcastCount: 0,
    };
    mapToday.set(snap.liveCategory, {
      ...prev,
      totalViewers: prev.totalViewers + snap.concurrentUserCount,
      broadcastCount: prev.broadcastCount + 1,
      liveCategory: snap.liveCategory,
    });
  }

  const today = Array.from(mapToday.values())
    .map((d) => ({
      category: d.liveCategoryValue,
      totalViewers: d.totalViewers,
      count: d.broadcastCount,
      avgViewers: Math.round(d.totalViewers / d.broadcastCount),
      concurrentViewers: Math.round(d.totalViewers / d.broadcastCount),
      categoryId: d.liveCategory,
    }))
    .sort((a, b) => b.totalViewers - a.totalViewers);
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kstNow.setUTCHours(0, 0, 0, 0);
  const todayKSTasUTC = new Date(kstNow.getTime() - 9 * 60 * 60 * 1000);

  const from7 = new Date(todayKSTasUTC);
  from7.setUTCDate(from7.getUTCDate() - 7);

  const from30 = new Date(todayKSTasUTC);
  from30.setUTCDate(from30.getUTCDate() - 30);

  const [rows7, rows30, channelInfo] = await Promise.all([
    prisma.streamerDailySummary.findMany({
      where: { channelId, date: { gte: from7 } },
      orderBy: { date: "asc" },
    }),
    prisma.streamerDailySummary.findMany({
      where: { channelId, date: { gte: from30 } },
      orderBy: { date: "asc" },
    }),
    prisma.streamer.findUnique({
      where: { channelId },
      select: { channelName: true, channelImageUrl: true },
    }),
  ]);

  // 7일: 게임별 합산
  const map7 = new Map<
    string,
    {
      liveCategoryValue: string;
      totalViewers: number;
      broadcastCount: number;
      liveCategory: string;
    }
  >();
  for (const row of rows7) {
    const prev = map7.get(row.liveCategory) ?? {
      liveCategoryValue: row.liveCategoryValue,
      liveCategory: row.liveCategory,
      totalViewers: 0,
      broadcastCount: 0,
    };
    map7.set(row.liveCategory, {
      ...prev,
      totalViewers: prev.totalViewers + row.totalViewers,
      broadcastCount: prev.broadcastCount + row.broadcastCount,
    });
  }

  // 30일: 게임별 합산
  const map30 = new Map<
    string,
    {
      liveCategoryValue: string;
      totalViewers: number;
      broadcastCount: number;
      liveCategory: string;
    }
  >();
  for (const row of rows30) {
    const prev = map30.get(row.liveCategory) ?? {
      liveCategoryValue: row.liveCategoryValue,
      liveCategory: row.liveCategory,
      totalViewers: 0,
      broadcastCount: 0,
    };
    map30.set(row.liveCategory, {
      ...prev,
      totalViewers: prev.totalViewers + row.totalViewers,
      broadcastCount: prev.broadcastCount + row.broadcastCount,
    });
  }

  const weekly = Array.from(map7.values())
    .map((d) => ({
      category: d.liveCategoryValue,
      totalViewers: d.totalViewers,
      count: d.broadcastCount,
      categoryId: d.liveCategory,
      avgViewers: Math.round(d.totalViewers / d.broadcastCount),
      concurrentViewers: Math.round(d.totalViewers / d.broadcastCount),
    }))
    .sort((a, b) => b.totalViewers - a.totalViewers);

  const monthly = Array.from(map30.values())
    .map((d) => ({
      category: d.liveCategoryValue,
      totalViewers: d.totalViewers,
      count: d.broadcastCount,
      categoryId: d.liveCategory,
      avgViewers: Math.round(d.totalViewers / d.broadcastCount),
      concurrentViewers: Math.round(d.totalViewers / d.broadcastCount),
    }))
    .sort((a, b) => b.totalViewers - a.totalViewers);

  return { today, weekly, monthly, channelInfo };
}

export async function getStreamerAllStats(channelId: string) {
  "use cache";
  cacheLife("statsTime");

  const rows = await prisma.streamerDailySummary.findMany({
    where: { channelId },
    orderBy: { date: "asc" },
  });
  const categoryIds = [...new Set(rows.map((r) => r.liveCategory))];
  const categories = await prisma.category.findMany({
    where: { categoryId: { in: categoryIds } },
    select: { categoryId: true, posterImageUrl: true },
  });
  const posterMap = new Map(
    categories.map((c) => [c.categoryId, c.posterImageUrl]),
  );
  const result = rows.map((r) => ({
    date: new Date(r.date.getTime() + 9 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    liveCategory: r.liveCategory,
    liveCategoryValue: r.liveCategoryValue,
    categoryType: r.categoryType,
    totalViewers: r.totalViewers,
    broadcastCount: r.broadcastCount,
    avgViewers: r.avgViewers,
    maxViewers: r.maxViewers,
    posterImageUrl: posterMap.get(r.liveCategory) ?? null,
  }));

  // console.log(
  //   "getStreamerAllStats 결과:",
  //   result.map((r) => ({ date: r.date, category: r.liveCategoryValue })),
  // );

  return result;
}

export type StreamerTopRecordEntry = {
  liveCategory: string;
  liveCategoryValue: string;
  posterImageUrl: string | null;
  maxViewers: number;
  liveTitle: string;
  date: string;
};

function toKSTFullDateString(date: Date): string {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export async function getStreamerTopRecords(channelId: string) {
  "use cache";
  cacheLife("statsTime");

  const topRecordsRaw = await prisma.streamerDailySummary.findMany({
    where: { channelId },
    orderBy: { maxViewers: "desc" },
    take: 50,
    select: {
      liveCategory: true,
      liveCategoryValue: true,
      maxViewers: true,
      liveTitle: true,
      date: true,
    },
  });

  // 게임별 최고 기록만 남긴 뒤 상위 10개
  const topGamesRaw = await prisma.$queryRaw<
    {
      liveCategory: string;
      liveCategoryValue: string;
      maxViewers: number;
      liveTitle: string;
      date: Date;
    }[]
  >`
    SELECT * FROM (
      SELECT DISTINCT ON ("liveCategory")
        "liveCategory", "liveCategoryValue", "maxViewers", "liveTitle", date
      FROM "StreamerDailySummary"
      WHERE "channelId" = ${channelId}
      ORDER BY "liveCategory", "maxViewers" DESC
    ) t
    ORDER BY "maxViewers" DESC
    LIMIT 50
  `;

  const categoryIds = [
    ...new Set([
      ...topRecordsRaw.map((r) => r.liveCategory),
      ...topGamesRaw.map((r) => r.liveCategory),
    ]),
  ];
  const categories = await prisma.category.findMany({
    where: { categoryId: { in: categoryIds } },
    select: { categoryId: true, posterImageUrl: true },
  });
  const posterMap = new Map(
    categories.map((c) => [c.categoryId, c.posterImageUrl]),
  );

  const toEntry = (r: {
    liveCategory: string;
    liveCategoryValue: string;
    maxViewers: number;
    liveTitle: string;
    date: Date;
  }): StreamerTopRecordEntry => ({
    liveCategory: r.liveCategory,
    liveCategoryValue: r.liveCategoryValue,
    posterImageUrl: posterMap.get(r.liveCategory) ?? null,
    maxViewers: r.maxViewers,
    liveTitle: r.liveTitle,
    date: toKSTFullDateString(r.date),
  });

  return {
    topRecords: topRecordsRaw.map(toEntry),
    topGames: topGamesRaw.map(toEntry),
  };
}

export async function getStreamerBasicInfo(channelId: string) {
  "use cache";
  cacheLife("statsTime");
  return prisma.streamer.findUnique({
    where: { channelId },
    select: { channelName: true, channelImageUrl: true },
  });
}
export type StreamerTrendGameBreakdown = {
  category: string;
  concurrentViewers: number;
  broadcastCount: number;
  liveTitle: string;
  maxViewers: number;
};

export type StreamerTrendRow = {
  date: string; // "YYYY-MM-DD"
  displayDate: string; // "MM-DD"
  totalViewers: number;
  concurrentViewers: number;
  broadcastCount: number;
  maxViewers: number;
  gameBreakdown: StreamerTrendGameBreakdown[];
};

export async function getStreamerTrend(
  channelId: string,
): Promise<StreamerTrendRow[]> {
  "use cache";
  cacheLife("statsTime");

  const rows = await prisma.streamerDailySummary.findMany({
    where: { channelId },
    orderBy: { date: "asc" },
  });

  const map = new Map<
    string,
    {
      totalViewers: number;
      broadcastCount: number;
      maxViewers: number;
      games: Map<
        string,
        {
          category: string;
          totalViewers: number;
          broadcastCount: number;
          maxViewers: number;
          liveTitle: string;
        }
      >;
    }
  >();

  for (const r of rows) {
    const kstDate = new Date(r.date.getTime() + 9 * 60 * 60 * 1000);
    const key = kstDate.toISOString().slice(0, 10);
    const prev = map.get(key) ?? {
      totalViewers: 0,
      broadcastCount: 0,
      maxViewers: 0,
      games: new Map(),
    };

    const prevGame = prev.games.get(r.liveCategory) ?? {
      category: r.liveCategoryValue,
      totalViewers: 0,
      broadcastCount: 0,
      maxViewers: 0,
      liveTitle: r.liveTitle,
    };
    prev.games.set(r.liveCategory, {
      category: r.liveCategoryValue,
      totalViewers: prevGame.totalViewers + r.totalViewers,
      broadcastCount: prevGame.broadcastCount + r.broadcastCount,
      maxViewers: Math.max(prevGame.maxViewers, r.maxViewers),
      liveTitle: r.liveTitle,
    });

    map.set(key, {
      totalViewers: prev.totalViewers + r.totalViewers,
      broadcastCount: prev.broadcastCount + r.broadcastCount,
      maxViewers: Math.max(prev.maxViewers, r.maxViewers),
      games: prev.games,
    });
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0))
    .map(([date, v]) => ({
      date,
      displayDate: date.slice(5),
      totalViewers: v.totalViewers,
      concurrentViewers:
        v.broadcastCount > 0
          ? Math.round(v.totalViewers / v.broadcastCount)
          : 0,
      broadcastCount: v.broadcastCount,
      maxViewers: v.maxViewers,
      gameBreakdown: Array.from(v.games.values())
        .map((g) => ({
          category: g.category,
          concurrentViewers:
            g.broadcastCount > 0
              ? Math.round(g.totalViewers / g.broadcastCount)
              : 0,
          maxViewers: g.maxViewers,
          broadcastCount: g.broadcastCount,
          liveTitle: g.liveTitle,
        }))
        .sort((a, b) => b.concurrentViewers - a.concurrentViewers),
    }));
}
