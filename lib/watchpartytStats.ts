import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";
import { getPeriodFrom } from "@/lib/stats";
import { getLives } from "./lives";

export async function getWatchpartyLives() {
  "use cache";
  cacheLife("statsTime");

  const lives = await getLives();
  return {
    collectedAt: lives.collectedAt,
    byViewers: lives.sportsByViewers,
    byCount: lives.sportsByCount,
  };
}

export async function getWatchpartyStats(
  period: "daily" | "weekly" | "monthly",
) {
  "use cache";
  cacheLife("statsTime");

  const from = getPeriodFrom(period);

  const rows = await prisma.dailySummary.findMany({
    where: { date: { gte: from }, categoryType: "SPORTS" },
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
    count: d.broadcastCount,
    categoryId: d.liveCategory,
    avgViewers: Math.round(d.totalViewers / d.broadcastCount),
    concurrentViewers:
      d.snapshotCount > 0 ? Math.round(d.totalViewers / d.snapshotCount) : 0,
  }));

  return {
    byViewers: [...result]
      .sort((a, b) => b.totalViewers - a.totalViewers)
      .slice(0, 10),
    byCount: [...result].sort((a, b) => b.count - a.count).slice(0, 10),
  };
}
