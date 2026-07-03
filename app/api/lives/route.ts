export async function GET() {
  let next: string | null = null;
  const allLives: any[] = [];

  for (let i = 0; i < 10; i++) {
    const url = new URL("https://openapi.chzzk.naver.com/open/v1/lives");
    url.searchParams.set("size", "20");
    if (next) url.searchParams.set("next", next);

    const res = await fetch(url.toString(), {
      headers: {
        "Client-Id": process.env.CHZZK_CLIENT_ID!,
        "Client-Secret": process.env.CHZZK_CLIENT_SECRET!,
        "Content-Type": "application/json",
      },
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
    { count: number; totalViewers: number }
  >();

  for (const live of filtered) {
    const existing = categoryMap.get(live.liveCategoryValue) ?? {
      count: 0,
      totalViewers: 0,
    };
    categoryMap.set(live.liveCategoryValue, {
      count: existing.count + 1,
      totalViewers: existing.totalViewers + live.concurrentUserCount,
    });
  }

  const result = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      totalViewers: data.totalViewers,
      avgViewers: Math.round(data.totalViewers / data.count),
    }))
    .sort((a, b) => b.totalViewers - a.totalViewers)
    .slice(0, 10); // 상위 10개만

  return Response.json({ result: allLives });
}
