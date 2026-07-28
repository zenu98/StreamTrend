import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

function getKSTDayBoundary(baseDate: Date, offsetDays = 0): Date {
  const kstBase = new Date(baseDate.getTime() + 9 * 60 * 60 * 1000);
  const kstDay = new Date(kstBase);
  kstDay.setUTCDate(kstDay.getUTCDate() + offsetDays);
  kstDay.setUTCHours(6, 0, 0, 0);
  return new Date(kstDay.getTime() - 9 * 60 * 60 * 1000);
}

export async function summarizeYesterday(
  targetDate?: Date,
  fromOverride?: Date,
  toOverride?: Date,
) {
  const base = targetDate ?? new Date();

  let from: Date;
  let to: Date;

  if (fromOverride && toOverride) {
    from = fromOverride;
    to = toOverride;
  } else if (targetDate) {
    from = getKSTDayBoundary(targetDate, 0);
    to = getKSTDayBoundary(targetDate, 1);
  } else {
    const kstBase = new Date(base.getTime() + 9 * 60 * 60 * 1000);
    const kstHour = kstBase.getUTCHours();
    const todayAt6UTC = getKSTDayBoundary(base, 0);
    from =
      kstHour >= 6 ? getKSTDayBoundary(base, -1) : getKSTDayBoundary(base, -2);
    to = kstHour >= 6 ? todayAt6UTC : getKSTDayBoundary(base, -1);
  }

  const summaryDate = new Date(from.getTime() + 9 * 60 * 60 * 1000);
  summaryDate.setUTCHours(0, 0, 0, 0);
  const summaryDateUTC = new Date(summaryDate.getTime() - 9 * 60 * 60 * 1000);

  const snapshots = await prisma.liveSnapshot.findMany({
    where: { collectedAt: { gte: from, lt: to } },
    select: {
      collectedAt: true,
      liveCategory: true,
      liveCategoryValue: true,
      categoryType: true,
      concurrentUserCount: true,
      channelId: true,
      channelName: true,
      channelImageUrl: true,
      liveTitle: true,
    },
  });

  if (snapshots.length === 0) {
    return { skipped: true, reason: "no-snapshots", date: summaryDateUTC };
  }

  // 카테고리별 집계
  const categoryMap = new Map<
    string,
    {
      liveCategory: string;
      liveCategoryValue: string;
      categoryType: string;
      totalViewers: number;
      count: number;
      snapsMap: Map<number, number>;
      peakViewers: number;
    }
  >();

  for (const snap of snapshots) {
    if (!snap.liveCategoryValue) continue;
    const key = `${snap.liveCategoryValue}__${snap.categoryType}`;
    const prev = categoryMap.get(key) ?? {
      liveCategory: snap.liveCategory,
      liveCategoryValue: snap.liveCategoryValue,
      categoryType: snap.categoryType,
      totalViewers: 0,
      count: 0,
      snapsMap: new Map<number, number>(),
      peakViewers: 0,
    };
    const snapsMap = prev.snapsMap;
    const t = snap.collectedAt.getTime();
    snapsMap.set(t, (snapsMap.get(t) ?? 0) + snap.concurrentUserCount);

    categoryMap.set(key, {
      ...prev,
      totalViewers: prev.totalViewers + snap.concurrentUserCount,
      count: prev.count + 1,
      snapsMap,
      peakViewers: Math.max(prev.peakViewers, snap.concurrentUserCount),
    });
  }

  const summaries = Array.from(categoryMap.values()).map((d) => {
    const snapshotCount = d.snapsMap.size;
    const maxViewers =
      d.snapsMap.size > 0 ? Math.max(...d.snapsMap.values()) : 0;

    return {
      date: summaryDateUTC,
      categoryType: d.categoryType,
      liveCategory: d.liveCategory,
      liveCategoryValue: d.liveCategoryValue,
      totalViewers: d.totalViewers,
      broadcastCount: d.count,
      snapshotCount,
      avgViewers: Math.round(d.totalViewers / d.count),
      maxViewers,
      peakViewers: d.peakViewers,
    };
  });

  // 스트리머별 집계
  const streamerMap = new Map<
    string,
    {
      channelId: string;
      channelName: string;
      channelImageUrl: string | null;
      liveCategory: string;
      liveCategoryValue: string;
      categoryType: string;
      maxViewers: number;
      totalViewers: number;
      count: number;
      titleCount: Map<string, number>;
    }
  >();

  for (const snap of snapshots) {
    if (!snap.liveCategoryValue) continue;
    const key = `${snap.channelId}__${snap.liveCategory}`;
    const prev = streamerMap.get(key) ?? {
      channelId: snap.channelId,
      channelName: snap.channelName,
      channelImageUrl: snap.channelImageUrl ?? null,
      liveCategory: snap.liveCategory,
      liveCategoryValue: snap.liveCategoryValue,
      categoryType: snap.categoryType,
      maxViewers: 0,
      totalViewers: 0,
      count: 0,
      titleCount: new Map<string, number>(),
    };
    const titleCount = prev.titleCount;
    titleCount.set(snap.liveTitle, (titleCount.get(snap.liveTitle) ?? 0) + 1);

    streamerMap.set(key, {
      ...prev,
      maxViewers: Math.max(prev.maxViewers, snap.concurrentUserCount),
      totalViewers: prev.totalViewers + snap.concurrentUserCount,
      count: prev.count + 1,
      titleCount,
    });
  }

  const streamerSummaries = Array.from(streamerMap.values()).map((d) => {
    const liveTitle =
      [...d.titleCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

    return {
      date: summaryDateUTC,
      categoryType: d.categoryType,
      channelId: d.channelId,
      channelName: d.channelName,
      channelImageUrl: d.channelImageUrl,
      liveCategory: d.liveCategory,
      liveCategoryValue: d.liveCategoryValue,
      totalViewers: d.totalViewers,
      maxViewers: d.maxViewers,
      broadcastCount: d.count,
      avgViewers: Math.round(d.totalViewers / d.count),
      liveTitle,
    };
  });
  await prisma.$transaction(
    [
      prisma.dailySummary.createMany({ data: summaries, skipDuplicates: true }),
      prisma.streamerDailySummary.createMany({
        data: streamerSummaries,
        skipDuplicates: true,
      }),
      prisma.liveSnapshot.deleteMany({
        where: { collectedAt: { gte: from, lt: to } },
      }),
    ],
    { timeout: 60000 },
  );
  revalidateTag("broadcast-rank", "broadcastRank");
  return {
    success: true,
    date: summaryDateUTC,
    range: { from, to },
    totalCount: summaries.length,
    streamerCount: streamerSummaries.length,
  };
}
