import { LiveSection } from "@/components/shared/LiveSection";
import { GameCompareChart } from "@/components/shared/GameCompareChart";
import { StatsSection } from "@/components/shared/StatsSection";
import { getStats, getStatsByDate, getWeeklyTopGames } from "@/lib/stats";
import { getLives } from "@/lib/lives";
import { Suspense } from "react";
import { TrendingGame } from "@/components/shared/TrendingGame";

export default function Home() {
  return (
    <main className="p-4 md:p-8 space-y-12">
      {/* <Suspense
        fallback={<div className="text-muted-foreground">로딩 중...</div>}
      >
        <LiveSection />
      </Suspense> */}
      <Suspense
        fallback={<div className="text-muted-foreground">로딩 중...</div>}
      >
        <HomeContent />
      </Suspense>
    </main>
  );
}

async function HomeContent() {
  const [daily, weekly, monthly, lives] = await Promise.all([
    getStats("daily"),
    getStats("weekly"),
    getStats("monthly"),
    getLives(),
  ]);
  // const top3Games = lives.byViewers.slice(0, 3).map((d) => d.category);
  console.time("getWeeklyTopGames");
  const topGames = await getWeeklyTopGames();
  console.timeEnd("getWeeklyTopGames");
  return (
    <>
      <section className="space-y-4">
        <h2 className="text-xl font-bold">주간 인기 게임 Top 10</h2>
        <TrendingGame games={topGames} />
      </section>
      <StatsSection
        daily={daily}
        weekly={weekly}
        monthly={monthly}
        lives={lives}
      />
      {/* <GameCompareChart
        defaultGames={top3Games}
        weekly={weeklyByDate}
        monthly={monthlyByDate}
      /> */}
    </>
  );
}
