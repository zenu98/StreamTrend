import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";

export const BROADCAST_CHANNEL_IDS = new Set([
  "9381e7d6816e6d915a44a13c0195b202", // LCK
  "a3b8f675d0611ab9efbdc8ca80138a8f", // 네이버 엔터
  "fce7c8735e0646e642007198a8875882", // EWC 공식 채널A
  "704c0743b9f6c9044871e5ca5a8905ba", // 치지직 축구 중계 A
]);

export function isSportsBroadcast(s: { channelId: string; liveTitle: string }) {
  return (
    BROADCAST_CHANNEL_IDS.has(s.channelId) ||
    s.liveTitle.toLowerCase().includes("watchparty") ||
    /msi\s*2026/i.test(s.liveTitle) ||
    s.liveTitle.includes("같이보기")
  );
}
export async function getLives() {
  "use cache";
  cacheLife("statsTime");

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

  // 게임: LCK 제외 + watchparty 제외
  const gameFiltered = snapshots.filter((s) => !isSportsBroadcast(s));

  // 같이보기: SPORTS + 특정채널 + watchparty
  const sportsFiltered = snapshots.filter(
    (s) => s.categoryType === "SPORTS" || isSportsBroadcast(s),
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
