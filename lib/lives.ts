import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";

const LCK_CHANNEL_ID = "9381e7d6816e6d915a44a13c0195b202";

export async function getLives() {
  "use cache";
  cacheLife("statsTime");
  console.log("getLives 실행됨");

  // 최신 collectedAt 배치 조회
  const latest = await prisma.liveSnapshot.findFirst({
    orderBy: { collectedAt: "desc" },
    select: { collectedAt: true },
  });

  if (!latest) {
    return {
      collectedAt: new Date().toISOString(),
      byViewers: [],
      byCount: [],
      allGames: [],
      sportsByViewers: [],
      sportsByCount: [],
      allGamesRaw: [],
    };
  }

  const snapshots = await prisma.liveSnapshot.findMany({
    where: { collectedAt: latest.collectedAt },
  });

  const collectedAt = latest.collectedAt.toISOString();

  // 게임: GAME + LCK 제외 + watchparty 제외 였는데 그냥 통합함.
  const gameFiltered = snapshots;

  // 같이보기: SPORTS + LCK + watchparty
  const sportsFiltered = snapshots.filter(
    (s) =>
      s.categoryType === "SPORTS" ||
      s.channelId === LCK_CHANNEL_ID ||
      s.liveTitle.toLowerCase().includes("watchparty") ||
      /msi\s*2026/i.test(s.liveTitle) ||
      s.liveTitle.includes("같이보기"),
  );

  function aggregateByCategory(snaps: typeof snapshots) {
    const map = new Map<
      string,
      { categoryId: string; count: number; totalViewers: number }
    >();

    for (const snap of snaps) {
      if (!snap.liveCategoryValue) continue;
      const existing = map.get(snap.liveCategoryValue) ?? {
        categoryId: snap.liveCategory,
        count: 0,
        totalViewers: 0,
      };
      map.set(snap.liveCategoryValue, {
        ...existing,
        count: existing.count + 1,
        totalViewers: existing.totalViewers + snap.concurrentUserCount,
      });
    }

    return Array.from(map.entries()).map(([category, data]) => ({
      category,
      categoryId: data.categoryId,
      count: data.count,
      totalViewers: data.totalViewers,
      concurrentViewers: data.totalViewers,
      avgViewers: Math.round(data.totalViewers / data.count),
      posterImageUrl: null as string | null,
    }));
  }

  const gameResult = aggregateByCategory(gameFiltered);
  const sportsResult = aggregateByCategory(sportsFiltered);

  // posterImageUrl
  const categoryIds = gameResult.map((r) => r.categoryId);
  const categories = await prisma.category.findMany({
    where: { categoryId: { in: categoryIds } },
    select: { categoryId: true, posterImageUrl: true },
  });

  const posterMap = new Map(
    categories.map((c) => [c.categoryId, c.posterImageUrl]),
  );

  const gameResultWithPoster = gameResult.map((r) => ({
    ...r,
    posterImageUrl: posterMap.get(r.categoryId) ?? null,
  }));

  return {
    collectedAt,
    byViewers: [...gameResultWithPoster]
      .sort((a, b) => b.totalViewers - a.totalViewers)
      .slice(0, 11),
    byCount: [...gameResultWithPoster]
      .sort((a, b) => b.count - a.count)
      .slice(0, 11),
    allGames: [...gameResultWithPoster].sort(
      (a, b) => b.totalViewers - a.totalViewers,
    ),
    sportsByViewers: [...sportsResult]
      .sort((a, b) => b.totalViewers - a.totalViewers)
      .slice(0, 11),
    sportsByCount: [...sportsResult]
      .sort((a, b) => b.count - a.count)
      .slice(0, 11),
    allGamesRaw: gameFiltered,
  };
}
