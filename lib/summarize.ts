import { prisma } from "@/lib/prisma";

function getKSTDayBoundary(baseDate: Date, offsetDays = 0): Date {
  const kstBase = new Date(baseDate.getTime() + 9 * 60 * 60 * 1000);
  const kstDay = new Date(kstBase);
  kstDay.setUTCDate(kstDay.getUTCDate() + offsetDays);
  kstDay.setUTCHours(6, 0, 0, 0);
  return new Date(kstDay.getTime() - 9 * 60 * 60 * 1000);
}

export async function summarizeYesterday(targetDate?: Date) {
  const base = targetDate ?? new Date();

  let from: Date;
  let to: Date;

  if (targetDate) {
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

  const existing = await prisma.dailySummary.findFirst({
    where: { date: summaryDateUTC },
  });
  if (existing) {
    return { skipped: true, date: summaryDateUTC };
  }

  const snapshots = await prisma.liveSnapshot.findMany({
    where: {
      collectedAt: { gte: from, lt: to },
      categoryType: "GAME",
      NOT: { channelId: "9381e7d6816e6d915a44a13c0195b202" },
    },
  });

  const filtered = snapshots.filter(
    (s) =>
      !s.tags.includes("lckwatchparty") &&
      !s.liveTitle.toLowerCase().includes("watchparty"),
  );

  // 게임 카테고리별 집계
  const categoryMap = new Map<
    string,
    {
      liveCategory: string;
      liveCategoryValue: string;
      totalViewers: number;
      count: number;
    }
  >();

  for (const snap of filtered) {
    const prev = categoryMap.get(snap.liveCategoryValue) ?? {
      liveCategory: snap.liveCategory,
      liveCategoryValue: snap.liveCategoryValue,
      totalViewers: 0,
      count: 0,
    };
    categoryMap.set(snap.liveCategoryValue, {
      ...prev,
      totalViewers: prev.totalViewers + snap.concurrentUserCount,
      count: prev.count + 1,
    });
  }

  const summaries = Array.from(categoryMap.values()).map((d) => ({
    date: summaryDateUTC,
    liveCategory: d.liveCategory,
    liveCategoryValue: d.liveCategoryValue,
    totalViewers: d.totalViewers,
    broadcastCount: d.count,
    avgViewers: Math.round(d.totalViewers / d.count),
  }));

  // 스트리머별 게임 집계
  // key: channelId + liveCategory
  const streamerMap = new Map<
    string,
    {
      channelId: string;
      channelName: string;
      channelImageUrl: string | null;
      liveCategory: string;
      liveCategoryValue: string;
      totalViewers: number;
      count: number;
    }
  >();

  for (const snap of filtered) {
    const key = `${snap.channelId}__${snap.liveCategory}`;
    const prev = streamerMap.get(key) ?? {
      channelId: snap.channelId,
      channelName: snap.channelName,
      channelImageUrl: snap.channelImageUrl ?? null,
      liveCategory: snap.liveCategory,
      liveCategoryValue: snap.liveCategoryValue,
      totalViewers: 0,
      count: 0,
    };
    streamerMap.set(key, {
      ...prev,
      totalViewers: prev.totalViewers + snap.concurrentUserCount,
      count: prev.count + 1,
    });
  }

  const streamerSummaries = Array.from(streamerMap.values()).map((d) => ({
    date: summaryDateUTC,
    channelId: d.channelId,
    channelName: d.channelName,
    channelImageUrl: d.channelImageUrl,
    liveCategory: d.liveCategory,
    liveCategoryValue: d.liveCategoryValue,
    totalViewers: d.totalViewers,
    broadcastCount: d.count,
    avgViewers: Math.round(d.totalViewers / d.count),
  }));

  // 트랜잭션: 게임 요약 + 스트리머 요약 저장 + 원본 삭제
  await prisma.$transaction([
    prisma.dailySummary.createMany({ data: summaries }),
    prisma.streamerDailySummary.createMany({ data: streamerSummaries }),
    prisma.liveSnapshot.deleteMany({
      where: { collectedAt: { gte: from, lt: to } },
    }),
  ]);

  return {
    success: true,
    date: summaryDateUTC,
    range: { from, to },
    gameCount: summaries.length,
    streamerCount: streamerSummaries.length,
  };
}
