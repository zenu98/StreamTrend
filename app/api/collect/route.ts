import { prisma } from "@/lib/prisma";

const LCK_CHANNEL_ID = "9381e7d6816e6d915a44a13c0195b202";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let next: string | null = null;
  let totalSaved = 0;
  const allLives: any[] = [];
  const collectedAt = new Date();

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
    });

    const json = await res.json();
    const lives = json.content?.data ?? [];
    next = json.content?.page?.next ?? null;

    allLives.push(...lives);

    await prisma.liveSnapshot.createMany({
      data: lives.map((live: any) => ({
        liveId: live.liveId,
        liveTitle: live.liveTitle,
        liveThumbnailImageUrl: live.liveThumbnailImageUrl,
        concurrentUserCount: live.concurrentUserCount,
        openDate: live.openDate,
        adult: live.adult,
        tags: live.tags,
        // LCK 채널은 SPORTS로 분류
        categoryType:
          live.channelId === LCK_CHANNEL_ID
            ? "SPORTS"
            : (live.categoryType ?? "ETC"),
        liveCategory: live.liveCategory ?? "",
        liveCategoryValue: live.liveCategoryValue ?? "",
        channelId: live.channelId,
        channelName: live.channelName,
        channelImageUrl: live.channelImageUrl,
        collectedAt,
      })),
    });

    totalSaved += lives.length;
    if (!next) break;
  }

  // GAME 카테고리만 Category 테이블에 저장
  const gameCategories = [
    ...new Map(
      allLives
        .filter(
          (live) =>
            live.categoryType === "GAME" &&
            live.liveCategory &&
            live.channelId !== LCK_CHANNEL_ID,
        )
        .map((live) => [live.liveCategory, live]),
    ).values(),
  ];

  // 스트리머 upsert (전체 방송 스트리머)
  const streamers = [
    ...new Map(
      allLives
        .filter((live) => live.channelId && live.channelName)
        .map((live) => [live.channelId, live]),
    ).values(),
  ];

  await Promise.all(
    streamers.map((live) =>
      prisma.streamer.upsert({
        where: { channelId: live.channelId },
        update: {
          channelName: live.channelName,
          channelImageUrl: live.channelImageUrl ?? null,
        },
        create: {
          channelId: live.channelId,
          channelName: live.channelName,
          channelImageUrl: live.channelImageUrl ?? null,
        },
      }),
    ),
  );

  const existingIds = (
    await prisma.category.findMany({
      where: {
        categoryId: { in: gameCategories.map((g) => g.liveCategory) },
      },
      select: { categoryId: true },
    })
  ).map((c) => c.categoryId);

  const newCategories = gameCategories.filter(
    (g) => !existingIds.includes(g.liveCategory),
  );

  await Promise.all(
    newCategories.map(async (game) => {
      const res = await fetch(
        `https://openapi.chzzk.naver.com/open/v1/categories/search?query=${encodeURIComponent(game.liveCategoryValue)}&size=20`,
        {
          headers: {
            "Client-Id": process.env.CHZZK_CLIENT_ID!,
            "Client-Secret": process.env.CHZZK_CLIENT_SECRET!,
          },
        },
      );
      const json = await res.json();
      console.log("검색쿼리:", game.liveCategory);
      console.log(
        "검색결과:",
        json.content?.data?.map((c: any) => c.categoryId),
      );
      const category = json.content?.data?.find(
        (c: any) => c.categoryId === game.liveCategory,
      );

      console.log("매칭:", category ? "성공" : "실패");
      if (!category) return;

      await prisma.category.upsert({
        where: { categoryId: game.liveCategory },
        update: { posterImageUrl: category.posterImageUrl },
        create: {
          categoryId: game.liveCategory,
          categoryValue: game.liveCategoryValue,
          posterImageUrl: category.posterImageUrl,
        },
      });
    }),
  );
  console.log("newCategoriesAdded:", newCategories.length);
  console.log("existingIds count:", existingIds.length);
  return Response.json({
    success: true,
    totalSaved,
    newCategoriesAdded: newCategories.length,
  });
}
