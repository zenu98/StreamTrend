import { cacheLife } from "next/cache";

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

  const filtered = allLives.filter(
    (live) =>
      live.categoryType === "GAME" &&
      live.channelName !== "LCK" &&
      !live.liveTitle.toLowerCase().includes("watchparty"),
  );

  const categoryMap = new Map<
    string,
    { categoryId: string; count: number; totalViewers: number }
  >();

  for (const live of filtered) {
    console.log(live.liveCategory, live.liveCategoryValue);

    const existing = categoryMap.get(live.liveCategoryValue) ?? {
      categoryId: live.liveCategory, // ← ID 저장
      count: 0,
      totalViewers: 0,
    };
    categoryMap.set(live.liveCategoryValue, {
      ...existing,
      count: existing.count + 1,
      totalViewers: existing.totalViewers + live.concurrentUserCount,
    });
  }

  const result = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    categoryId: data.categoryId, // ← 추가
    count: data.count,
    totalViewers: data.totalViewers,
    avgViewers: Math.round(data.totalViewers / data.count),
  }));

  return {
    collectedAt,
    byViewers: [...result]
      .sort((a, b) => b.totalViewers - a.totalViewers)
      .slice(0, 13),
    byCount: [...result].sort((a, b) => b.count - a.count).slice(0, 13),
    allGames: [...result].sort((a, b) => b.totalViewers - a.totalViewers),
  };
}
