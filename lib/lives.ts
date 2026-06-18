import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";

const LCK_CHANNEL_ID = "9381e7d6816e6d915a44a13c0195b202";

export async function getLives() {
  "use cache";
  cacheLife("statsTime");
  console.log("getLives 실행됨");
  let next: string | null = null;
  const allLives: any[] = [];
  const collectedAt = new Date().toISOString();

  for (let i = 0; i < 100; i++) {
    const url = new URL("https://openapi.chzzk.naver.com/open/v1/lives");
    url.searchParams.set("size", "20");
    if (next) url.searchParams.set("next", next);

    const res = await fetch(url.toString(), {
      headers: {
        "Client-Id": process.env.CHZZK_CLIENT_ID!,
        "Client-Secret": process.env.CHZZK_CLIENT_SECRET!,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const json = await res.json();
    const lives = json.content?.data ?? [];
    next = json.content?.page?.next ?? null;

    allLives.push(...lives);
    if (!next) break;
  }

  // 게임: GAME 카테고리 + LCK 채널 제외 + watchparty 제외
  const gameFiltered = allLives.filter(
    (live) =>
      live.categoryType === "GAME" &&
      live.channelId !== LCK_CHANNEL_ID &&
      !live.liveTitle.toLowerCase().includes("watchparty"),
  );

  // 같이보기: SPORTS + LCK 공식 채널 + watchparty 포함 방송
  const sportsFiltered = allLives.filter(
    (live) =>
      live.categoryType === "SPORTS" ||
      live.channelId === LCK_CHANNEL_ID ||
      live.liveTitle.toLowerCase().includes("watchparty"),
  );

  function aggregateByCategory(lives: any[]) {
    const map = new Map<
      string,
      { categoryId: string; count: number; totalViewers: number }
    >();

    for (const live of lives) {
      if (!live.liveCategoryValue) continue;
      const existing = map.get(live.liveCategoryValue) ?? {
        categoryId: live.liveCategory,
        count: 0,
        totalViewers: 0,
      };
      map.set(live.liveCategoryValue, {
        ...existing,
        count: existing.count + 1,
        totalViewers: existing.totalViewers + live.concurrentUserCount,
      });
    }

    return Array.from(map.entries()).map(([category, data]) => ({
      category,
      categoryId: data.categoryId,
      count: data.count,
      totalViewers: data.totalViewers,
      avgViewers: Math.round(data.totalViewers / data.count),
      posterImageUrl: null as string | null,
    }));
  }

  const gameResult = aggregateByCategory(gameFiltered);
  const sportsResult = aggregateByCategory(sportsFiltered);

  // Category 테이블에서 posterImageUrl 가져오기 (게임만)
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
  console.log(
    "sportsFiltered categories:",
    sportsFiltered.map((l) => l.liveCategoryValue),
  );
  console.log(
    "sportsByViewers:",
    sportsResult.map((r) => r.category),
  );
  return {
    collectedAt,
    byViewers: [...gameResultWithPoster]
      .sort((a, b) => b.totalViewers - a.totalViewers)
      .slice(0, 13),
    byCount: [...gameResultWithPoster]
      .sort((a, b) => b.count - a.count)
      .slice(0, 13),
    allGames: [...gameResultWithPoster].sort(
      (a, b) => b.totalViewers - a.totalViewers,
    ),
    sportsByViewers: [...sportsResult]
      .sort((a, b) => b.totalViewers - a.totalViewers)
      .slice(0, 13),
    sportsByCount: [...sportsResult]
      .sort((a, b) => b.count - a.count)
      .slice(0, 13),
    allGamesRaw: gameFiltered,
  };
}
