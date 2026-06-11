import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";

export function getPeriodFrom(period: "daily" | "weekly" | "monthly"): Date {
  const now = new Date();
  // KST 기준 오늘 00:00 UTC
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kstNow.setUTCHours(0, 0, 0, 0);
  const todayKSTasUTC = new Date(kstNow.getTime() - 9 * 60 * 60 * 1000);

  if (period === "daily") {
    // 어제 하루치 1개
    const from = new Date(todayKSTasUTC);
    from.setUTCDate(from.getUTCDate() - 1);
    return from;
  }
  if (period === "weekly") {
    // 최근 7일
    const from = new Date(todayKSTasUTC);
    from.setUTCDate(from.getUTCDate() - 7);
    return from;
  }
  // monthly: 최근 30일
  const from = new Date(todayKSTasUTC);
  from.setUTCDate(from.getUTCDate() - 30);
  return from;
}

export async function getStats(period: "daily" | "weekly" | "monthly") {
  "use cache";
  cacheLife("statsTime");

  const from = getPeriodFrom(period);

  const rows = await prisma.dailySummary.findMany({
    where: { date: { gte: from } },
  });

  // 게임별 합산
  const categoryMap = new Map<
    string,
    {
      liveCategory: string;
      liveCategoryValue: string;
      totalViewers: number;
      broadcastCount: number;
    }
  >();

  for (const row of rows) {
    const prev = categoryMap.get(row.liveCategoryValue) ?? {
      liveCategory: row.liveCategory,
      liveCategoryValue: row.liveCategoryValue,
      totalViewers: 0,
      broadcastCount: 0,
    };
    categoryMap.set(row.liveCategoryValue, {
      ...prev,
      totalViewers: prev.totalViewers + row.totalViewers,
      broadcastCount: prev.broadcastCount + row.broadcastCount,
    });
  }

  const result = Array.from(categoryMap.values()).map((d) => ({
    category: d.liveCategoryValue,
    totalViewers: d.totalViewers,
    count: d.broadcastCount,
    avgViewers: Math.round(d.totalViewers / d.broadcastCount),
  }));

  return {
    byViewers: [...result]
      .sort((a, b) => b.totalViewers - a.totalViewers)
      .slice(0, 10),
    byCount: [...result].sort((a, b) => b.count - a.count).slice(0, 10),
  };
}
