import { getStats, getStatsByDate } from "@/lib/stats";
import { ChartBarMixed } from "@/components/ui/charts/bar-chart-mixed";
import { GameCompareChart } from "@/components/shared/GameCompareChart";
import { Suspense } from "react";
import { getLives } from "@/lib/lives";
import { RankingCards } from "@/components/ui/charts/ranking-card-chart";
import { StatsSection } from "@/components/shared/StatsSection";

export default async function StatsPage() {
  const [daily, weekly, monthly, weeklyByDate, monthlyByDate, lives] =
    await Promise.all([
      getStats("daily"),
      getStats("weekly"),
      getStats("monthly"),
      getStatsByDate("weekly"),
      getStatsByDate("monthly"),
      getLives(),
    ]);
  const top3Games = lives.byViewers.slice(0, 3).map((d) => d.category);
  const periods = [
    { label: "어제", data: daily },
    { label: "최근 7일", data: weekly },
    { label: "최근 30일", data: monthly },
  ];

  return (
    <main className="p-4 md:p-8 space-y-12">
      <h1 className="text-2xl md:text-3xl font-bold">통계</h1>

      <Suspense
        fallback={<div className="text-muted-foreground">로딩 중...</div>}
      >
        <GameCompareChart
          defaultGames={top3Games}
          weekly={weeklyByDate}
          monthly={monthlyByDate}
        />
        <StatsSection daily={daily} weekly={weekly} monthly={monthly} />
      </Suspense>
    </main>
  );
}
