import { getMonthWeekOptions } from "@/lib/utils";
import { getGameRanking } from "@/lib/gameStats";
import { GameRankingPageClient } from "@/components/game/GameRankingPageClient";
import { connection } from "next/server";

export default async function GameRankingPage() {
  await connection();

  const groups = getMonthWeekOptions();
  const initialMonthIndex = groups.length - 1;
  const initialWeekIndex = groups[initialMonthIndex].weeks.length - 1;
  const initialWeek = groups[initialMonthIndex].weeks[initialWeekIndex];

  const initialGames = await getGameRanking(initialWeek.from, initialWeek.to);

  return (
    <main className="p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold">게임 순위</h1>
      <GameRankingPageClient
        groups={groups.map((g) => ({
          label: g.label,
          weeks: g.weeks.map((w) => ({ label: w.label })),
        }))}
        initialMonthIndex={initialMonthIndex}
        initialWeekIndex={initialWeekIndex}
        initialGames={initialGames}
      />
    </main>
  );
}
