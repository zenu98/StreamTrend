import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const games = searchParams.get("games")?.split(",") ?? [];
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  if (!games.length || !from || !to) {
    return Response.json({ error: "missing params" }, { status: 400 });
  }

  const rows = await prisma.dailySummary.findMany({
    where: {
      liveCategory: { in: games },
      date: { gte: new Date(from), lte: new Date(to) },
    },
    orderBy: { date: "asc" },
  });

  // 게임별로 구조화
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
    const date = row.date.toISOString().slice(5, 10);
    if (!gameMap.has(row.liveCategoryValue)) {
      gameMap.set(row.liveCategoryValue, new Map());
    }
    gameMap.get(row.liveCategoryValue)!.set(date, {
      concurrentViewers:
        row.snapshotCount > 0
          ? Math.round(row.totalViewers / row.snapshotCount)
          : 0,
      maxViewers: row.maxViewers,
      peakViewers: row.peakViewers,
    });
  }

  const allDates = [
    ...new Set(rows.map((r) => r.date.toISOString().slice(5, 10))),
  ].sort();

  const result = {
    dates: allDates,
    games: Array.from(gameMap.entries()).map(([game, dateMap]) => ({
      game,
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
