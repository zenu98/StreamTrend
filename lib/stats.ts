import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";

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

  const categoryMap = new Map<
    string,
    {
      liveCategory: string;
      liveCategoryValue: string;
      totalViewers: number;
      broadcastCount: number;
      snapshotCount: number;
    }
  >();

  for (const row of rows) {
    const prev = categoryMap.get(row.liveCategoryValue) ?? {
      liveCategory: row.liveCategory,
      liveCategoryValue: row.liveCategoryValue,
      totalViewers: 0,
      broadcastCount: 0,
      snapshotCount: 0,
    };
    categoryMap.set(row.liveCategoryValue, {
      ...prev,
      totalViewers: prev.totalViewers + row.totalViewers,
      broadcastCount: prev.broadcastCount + row.broadcastCount,
      snapshotCount: prev.snapshotCount + row.snapshotCount,
    });
  }

  const result = Array.from(categoryMap.values()).map((d) => ({
    category: d.liveCategoryValue,
    totalViewers: d.totalViewers,
    count:
      d.snapshotCount > 0
        ? Math.round(d.broadcastCount / d.snapshotCount)
        : d.broadcastCount,
    avgViewers: Math.round(d.totalViewers / d.broadcastCount),
    concurrentViewers: Math.round(d.totalViewers / d.snapshotCount),
  }));

  return {
    byConcurrentViewers: [...result]
      .sort((a, b) => b.concurrentViewers - a.concurrentViewers)
      .slice(0, 10),
    byViewers: [...result]
      .sort((a, b) => b.avgViewers - a.avgViewers)
      .slice(0, 10),
    byCount: [...result].sort((a, b) => b.count - a.count).slice(0, 10),
  };
}
