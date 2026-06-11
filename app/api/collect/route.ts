import { prisma } from "@/lib/prisma";

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
        categoryType: live.categoryType ?? "ETC",
        liveCategory: live.liveCategory ?? "",
        liveCategoryValue: live.liveCategoryValue ?? "",
        channelId: live.channelId,
        channelName: live.channelName,
        channelImageUrl: live.channelImageUrl,
      })),
    });

    totalSaved += lives.length;
    if (!next) break;
  }

  // GAME 카테고리만 추출, 중복 제거
  const gameCategories = [
    ...new Map(
      allLives
        .filter((live) => live.categoryType === "GAME" && live.liveCategory)
        .map((live) => [live.liveCategory, live]),
    ).values(),
  ];

  // Category 테이블에 없는 게임만 필터
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

  // 새 게임만 치지직 카테고리 API 호출
  await Promise.all(
    newCategories.map(async (game) => {
      const res = await fetch(
        `https://openapi.chzzk.naver.com/open/v1/categories/search?query=${encodeURIComponent(game.liveCategory)}&size=5`,
        {
          headers: {
            "Client-Id": process.env.CHZZK_CLIENT_ID!,
            "Client-Secret": process.env.CHZZK_CLIENT_SECRET!,
          },
        },
      );
      const json = await res.json();
      const category = json.content?.data?.find(
        (c: any) => c.categoryId === game.liveCategory,
      );
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

  return Response.json({
    success: true,
    totalSaved,
    newCategoriesAdded: newCategories.length,
  });
}
