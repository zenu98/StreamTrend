import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";
import { getLives } from "@/lib/lives";

export async function getGameCategories() {
  "use cache";
  cacheLife("statsTime");

  const lives = await getLives();

  const categoryIds = lives.allGames.map((g) => g.categoryId);
  const categories = await prisma.category.findMany({
    where: { categoryId: { in: categoryIds } },
  });

  const posterMap = new Map(
    categories.map((c) => [c.categoryId, c.posterImageUrl]),
  );

  return lives.allGames.map((game) => ({
    ...game,
    posterImageUrl: posterMap.get(game.categoryId) ?? null,
  }));
}
