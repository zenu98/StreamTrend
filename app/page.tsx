import { LiveSection } from "@/components/shared/LiveSection";
import { GameCompareChart } from "@/components/game/GameCompareChart";
import { StatsSection } from "@/components/shared/StatsSection";
import {
  getStats,
  getStatsByDate,
  getWeeklyTopGames,
  getWeeklyTopStreamers,
} from "@/lib/stats";
import { getLives } from "@/lib/lives";
import { Suspense } from "react";
import { TrendingGame } from "@/components/main/TrendingGame";
import { TrendingStreamer } from "@/components/main/TrendingStreamer";

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
  // const [daily, weekly, monthly, lives] = await Promise.all([
  //   getStats("daily"),
  //   getStats("weekly"),
  //   getStats("monthly"),
  //   getLives(),
  // ]);

  // const [topGames, topStreamers] = await Promise.all([
  //   getWeeklyTopGames(),
  //   getWeeklyTopStreamers(),
  // ]);
  const [topGames, topStreamers] = await Promise.all([
    getWeeklyTopGames(),
    getWeeklyTopStreamers(),
  ]);

  return (
    <>
      <main className="space-y-32 mx-auto">
        <TrendingGame
          byConcurrent={topGames.byConcurrent}
          byMax={topGames.byMax}
          byPeak={topGames.byPeak}
        />
        <TrendingStreamer streamers={topStreamers} />
      </main>
      {/* <StatsSection
        daily={daily}
        weekly={weekly}
        monthly={monthly}
        lives={lives}
      /> */}
      {/* <GameCompareChart
        defaultGames={top3Games}
        weekly={weeklyByDate}
        monthly={monthlyByDate}
      /> */}
    </>
  );
}
