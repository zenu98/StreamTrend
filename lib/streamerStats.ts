import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";

export async function getStreamerStats(channelId: string) {
  "use cache";
  cacheLife("statsTime");

  // 당일: LiveSnapshot에서 실시간 조회
  const now = new Date();
  const kstNow2 = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const kstMidnight = new Date(kstNow2);
  kstMidnight.setUTCHours(0, 0, 0, 0);
  const todayFrom = new Date(kstMidnight.getTime() - 9 * 60 * 60 * 1000);

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

  return rows.map((r) => ({
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
  }));
}
