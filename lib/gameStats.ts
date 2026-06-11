import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";

export async function getGameCategoryInfo(categoryId: string) {
  "use cache";
  cacheLife("statsTime");
  return prisma.category.findUnique({ where: { categoryId } });
}
export async function getGameStats(categoryId: string) {
  "use cache";
  cacheLife("statsTime");

  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kstNow.setUTCHours(0, 0, 0, 0);
  const todayKSTasUTC = new Date(kstNow.getTime() - 9 * 60 * 60 * 1000);

  // 최근 30일 (주간/월간 둘 다 커버)
  const from30 = new Date(todayKSTasUTC);
  from30.setUTCDate(from30.getUTCDate() - 30);

  // 연간 (올해 1월 1일부터)
  const fromYear = new Date(
    Date.UTC(kstNow.getUTCFullYear(), 0, 1) - 9 * 60 * 60 * 1000,
  );

  const rows = await prisma.dailySummary.findMany({
    where: {
      liveCategory: categoryId,
      date: { gte: fromYear },
    },
    orderBy: { date: "asc" },
  });

  // 주간: 최근 7일
  const from7 = new Date(todayKSTasUTC);
  from7.setUTCDate(from7.getUTCDate() - 7);
  const weekly = rows
    .filter((r) => r.date >= from7)
    .map((r) => ({
      date: new Date(r.date.getTime() + 9 * 60 * 60 * 1000)
        .toISOString()
        .slice(5, 10), // MM-DD
      totalViewers: r.totalViewers,
      broadcastCount: r.broadcastCount,
    }));

  // 월간: 최근 30일
  const monthly = rows
    .filter((r) => r.date >= from30)
    .map((r) => ({
      date: new Date(r.date.getTime() + 9 * 60 * 60 * 1000)
        .toISOString()
        .slice(5, 10),
      totalViewers: r.totalViewers,
      broadcastCount: r.broadcastCount,
    }));

  // 연간: 월별 합산
  const monthMap = new Map<
    string,
    { totalViewers: number; broadcastCount: number }
  >();
  for (const r of rows) {
    const kstDate = new Date(r.date.getTime() + 9 * 60 * 60 * 1000);
    const key = `${kstDate.getUTCMonth() + 1}월`;
    const prev = monthMap.get(key) ?? { totalViewers: 0, broadcastCount: 0 };
    monthMap.set(key, {
      totalViewers: prev.totalViewers + r.totalViewers,
      broadcastCount: prev.broadcastCount + r.broadcastCount,
    });
  }
  const yearly = Array.from(monthMap.entries()).map(([month, data]) => ({
    date: month,
    totalViewers: data.totalViewers,
    broadcastCount: data.broadcastCount,
  }));
  console.log("categoryId:", categoryId);
  console.log("rows:", rows.length);
  return { weekly, monthly, yearly };
}
