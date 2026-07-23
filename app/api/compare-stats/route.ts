import { prisma } from "@/lib/prisma";
import { toKSTDateString } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const games = searchParams.get("games")?.split(",") ?? [];
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  if (!games.length || !from || !to) {
    return Response.json({ error: "missing params" }, { status: 400 });
  }

  const toDate = new Date(to);
  toDate.setDate(toDate.getDate() + 1);

  const rows = await prisma.dailySummary.findMany({
    where: {
      liveCategory: { in: games },
      date: { gte: new Date(from), lt: toDate },
    },
    orderBy: { date: "asc" },
  });

  const gameMap = new Map<
    string,
    Map<
      string,
      {
        concurrentViewers: number;
        maxViewers: number;
        peakViewers: number;
      }
    >
  >();

  for (const row of rows) {
    const date = toKSTDateString(row.date);
    if (!gameMap.has(row.liveCategory)) {
      gameMap.set(row.liveCategory, new Map());
    }
    gameMap.get(row.liveCategory)!.set(date, {
      concurrentViewers:
        row.snapshotCount > 0
          ? Math.round(row.totalViewers / row.snapshotCount)
          : 0,
      maxViewers: row.maxViewers,
      peakViewers: row.peakViewers,
    });
  }

  const allDates = [
    ...new Set(rows.map((r) => toKSTDateString(r.date))),
  ].sort();

  const result = {
    dates: allDates,
    games: Array.from(gameMap.entries()).map(([categoryId, dateMap]) => ({
      categoryId,
      data: allDates.map((date) => ({
        date,
        concurrentViewers: dateMap.get(date)?.concurrentViewers ?? 0,
        maxViewers: dateMap.get(date)?.maxViewers ?? 0,
        peakViewers: dateMap.get(date)?.peakViewers ?? 0,
      })),
    })),
  };

  return Response.json(result);
}
