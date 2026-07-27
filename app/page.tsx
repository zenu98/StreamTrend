import { LiveSection } from "@/components/shared/LiveSection";
import { GameCompareChart } from "@/components/game/GameCompareChart";
import { StatsSection } from "@/components/shared/StatsSection";
import {
  getStats,
  getStatsByDate,
  get3DaysTopGames,
  getWeeklyTopStreamers,
  get3DaysTopStreamers,
  getLiveStreamers,
} from "@/lib/stats";
import { getLives } from "@/lib/lives";
import { Suspense } from "react";
import { TrendingGame } from "@/components/main/TrendingGame";
import { TrendingStreamer } from "@/components/main/TrendingStreamer";

export default function Home() {
  return (
    <main className="md:p-8 space-y-12">
      <Suspense
        fallback={<div className="text-muted-foreground">로딩 중...</div>}
      >
        <HomeContent />
      </Suspense>
    </main>
  );
}

async function HomeContent() {
  const [topGames, topStreamers] = await Promise.all([
    get3DaysTopGames(),
    get3DaysTopStreamers(),
  ]);

  // await 하지 않음 — 백그라운드에서 병렬로 진행되되, 페이지 렌더링을 막지 않음
  const livePromise = getLiveGamesData();
  const liveStreamerPromise = getLiveStreamers();

  return (
    <div className="space-y-32 max-w-6xl 2xl:max-w-7xl  mx-auto">
      <TrendingGame
        livePromise={livePromise}
        byMax={topGames.byMax}
        byPeak={topGames.byPeak}
      />
      <TrendingStreamer
        streamers={topStreamers}
        liveStreamerPromise={liveStreamerPromise}
      />
    </div>
  );
}

async function getLiveGamesData() {
  const lives = await getLives();
  const byLive = lives.byViewers.map((g) => ({
    category: g.category,
    categoryId: g.categoryId,
    totalViewers: g.totalViewers,
    concurrentViewers: g.totalViewers,
    maxViewers: g.totalViewers,
    peakViewers: g.totalViewers,
    posterImageUrl: g.posterImageUrl,
    topStreamer: null,
  }));
  return { byLive, collectedAt: lives.collectedAt };
}
