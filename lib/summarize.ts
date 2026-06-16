import { prisma } from "@/lib/prisma";

const LCK_CHANNEL_ID = "9381e7d6816e6d915a44a13c0195b202";

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
      categoryType: { in: ["GAME", "SPORTS"] },
    },
  });

  // 게임: GAME + LCK 채널 제외 + watchparty 제외
  const gameSnaps = snapshots.filter(
    (s) =>
      s.categoryType === "GAME" &&
      s.channelId !== LCK_CHANNEL_ID &&
      !s.liveTitle.toLowerCase().includes("watchparty"),
  );

  // 같이보기: SPORTS + LCK 공식 채널 + watchparty 포함
  const sportsSnaps = snapshots.filter(
    (s) =>
      s.categoryType === "SPORTS" ||
      s.channelId === LCK_CHANNEL_ID ||
      s.liveTitle.toLowerCase().includes("watchparty"),
  );

  function aggregateByCategory(snaps: typeof snapshots, categoryType: string) {
    const map = new Map<
      string,
      {
        liveCategory: string;
        liveCategoryValue: string;
        totalViewers: number;
        count: number;
      }
    >();

    for (const snap of snaps) {
      if (!snap.liveCategoryValue) continue;
      const prev = map.get(snap.liveCategoryValue) ?? {
        liveCategory: snap.liveCategory,
        liveCategoryValue: snap.liveCategoryValue,
        totalViewers: 0,
        count: 0,
      };
      map.set(snap.liveCategoryValue, {
        ...prev,
        totalViewers: prev.totalViewers + snap.concurrentUserCount,
        count: prev.count + 1,
      });
    }

    return Array.from(map.values()).map((d) => {
      const gameSnaps = snaps.filter(
        (s) => s.liveCategoryValue === d.liveCategoryValue,
      );
      const gameCollectedAts = new Set(
        gameSnaps.map((s) => s.collectedAt.getTime()),
      );
      const snapshotCount = gameCollectedAts.size;

      const timeMap = new Map<number, number>();
      for (const snap of gameSnaps) {
        const t = snap.collectedAt.getTime();
        timeMap.set(t, (timeMap.get(t) ?? 0) + snap.concurrentUserCount);
      }
      const maxViewers = timeMap.size > 0 ? Math.max(...timeMap.values()) : 0;
      const peakViewers =
        gameSnaps.length > 0
          ? Math.max(...gameSnaps.map((s) => s.concurrentUserCount))
          : 0;

      return {
        date: summaryDateUTC,
        categoryType,
        liveCategory: d.liveCategory,
        liveCategoryValue: d.liveCategoryValue,
        totalViewers: d.totalViewers,
        broadcastCount: d.count,
        snapshotCount,
        avgViewers: Math.round(d.totalViewers / d.count),
        maxViewers,
        peakViewers,
      };
    });
  }

  const gameSummaries = aggregateByCategory(gameSnaps, "GAME");
  const sportsSummaries = aggregateByCategory(sportsSnaps, "SPORTS");
  const summaries = [...gameSummaries, ...sportsSummaries];

  // 스트리머별 집계
  const allSnaps = [...gameSnaps, ...sportsSnaps];
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
    }
  >();

  for (const snap of allSnaps) {
    const effectiveCategoryType =
      snap.channelId === LCK_CHANNEL_ID ||
      snap.liveTitle.toLowerCase().includes("watchparty")
        ? "SPORTS"
        : snap.categoryType;

    const key = `${snap.channelId}__${snap.liveCategory}`;
    const prev = streamerMap.get(key) ?? {
      channelId: snap.channelId,
      channelName: snap.channelName,
      channelImageUrl: snap.channelImageUrl ?? null,
      liveCategory: snap.liveCategory,
      liveCategoryValue: snap.liveCategoryValue,
      categoryType: effectiveCategoryType,
      maxViewers: 0,
      totalViewers: 0,
      count: 0,
    };
    streamerMap.set(key, {
      ...prev,
      maxViewers: Math.max(prev.maxViewers, snap.concurrentUserCount),
      totalViewers: prev.totalViewers + snap.concurrentUserCount,
      count: prev.count + 1,
    });
  }

  const streamerSummaries = Array.from(streamerMap.values()).map((d) => ({
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
  }));

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
    gameCount: gameSummaries.length,
    sportsCount: sportsSummaries.length,
    streamerCount: streamerSummaries.length,
  };
}
