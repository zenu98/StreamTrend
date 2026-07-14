import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";
import { getLives } from "@/lib/lives";

// 실시간 라이브 게임 카테고리 가져오기
export async function getGameCategories() {
  "use cache";
  cacheLife("statsTime");

  const lives = await getLives();
  return lives.allGames;
}

// 카테고리 테이블에 있는 게임들 다 가져오기
export async function getAllCategories() {
  "use cache";
  cacheLife("statsTime");

  return prisma.category.findMany({
    select: { categoryId: true, categoryValue: true },
    orderBy: { categoryValue: "asc" },
  });
}
