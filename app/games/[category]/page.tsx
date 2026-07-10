import { Suspense } from "react";
import {
  getGameCategoryInfo,
  getGameLiveStats,
  getGameStats,
  getGameTopStreamers,
} from "@/lib/gameStats";
import Image from "next/image";
import { GameChartTabs } from "@/components/game/GameChartTabs";
import { getAllCategories } from "@/lib/games";
import { GameTopStreamers } from "@/components/game/GameTopStreamers";
import { CurrentStatsStrip } from "@/components/shared/CurrentStatsStrip";

import { AllTimeRecordCard } from "@/components/shared/AllTimeRecordCard";

import { ViewerConcentrationSection } from "@/components/shared/ViewerConcentrationSection";
import { toKSTDateString } from "@/lib/utils";

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  return (
    <Suspense
      fallback={<div className="p-8 text-muted-foreground">로딩 중...</div>}
    >
      <GameDetail paramsPromise={params} />
    </Suspense>
  );
}

async function GameDetail({
  paramsPromise,
}: {
  paramsPromise: Promise<{ category: string }>;
}) {
  const { category } = await paramsPromise;
  const categoryId = decodeURIComponent(category);

  const [stats, liveStats, categoryInfo, allCategories, topStreamers] =
    await Promise.all([
      getGameStats(categoryId),
      getGameLiveStats(categoryId),
      getGameCategoryInfo(categoryId),
      getAllCategories(),
      getGameTopStreamers(categoryId),
    ]);

  return (
    <main className="p-4 mx-auto w-full  space-y-8 ">
      {/* 헤더 */}
      <div className="flex items-center gap-4 md:gap-6">
        {categoryInfo?.posterImageUrl && (
          <div className="relative aspect-[3/4] w-32 md:w-48 rounded-lg overflow-hidden shrink-0">
            <Image
              src={categoryInfo.posterImageUrl}
              alt={categoryInfo.categoryValue}
              fill
              sizes="(max-width: 768px) 64px, 96px"
              className="object-cover"
            />
          </div>
        )}
        <h1 className="flex-col text-2xl md:text-3xl font-bold">
          <p>{categoryInfo?.categoryValue}</p>
          <p className="text-xl font-normal text-muted-foreground">
            {categoryInfo?.categoryId.replace(/_/g, " ")}
          </p>
        </h1>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg md:text-xl font-bold">현재</h2>
        <CurrentStatsStrip
          currentViewers={liveStats.currentViewers}
          currentCount={liveStats.currentCount}
          viewerTier={liveStats.viewerTier}
          countTier={liveStats.countTier}
          currentMaxViewer={liveStats.currentMaxViewer}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg md:text-xl font-bold">역대</h2>
        <AllTimeRecordCard
          maxViewers={stats.maxViewers}
          maxViewersDate={stats.maxViewersDate}
        />
      </section>

      <section className="space-y-4">
        <ViewerConcentrationSection
          viewerPercentile={liveStats.viewerPercentile}
          countPercentile={liveStats.countPercentile}
          viewerRank={liveStats.viewerRank}
          countRank={liveStats.countRank}
          viewerTieCount={liveStats.viewerTieCount}
          countTieCount={liveStats.countTieCount}
          totalGames={liveStats.totalGames}
          totalCountAll={liveStats.totalCountAll}
          viewerShare={liveStats.viewerShare}
          countShare={liveStats.countShare}
          currentCount={liveStats.currentCount}
          trendRows={stats.allRows}
          currentViewers={liveStats.currentViewers}
          todayLabel={toKSTDateString(new Date())}
        />
      </section>

      {/* 역대 최고 시청자 랭킹 */}
      <section className="space-y-4">
        <GameTopStreamers
          topRecords={topStreamers.topRecords}
          topChannels={topStreamers.topChannels}
        />
      </section>

      <section className="space-y-4 mt-24">
        <GameChartTabs
          allRows={stats.allRows}
          defaultGame={categoryInfo?.categoryValue ?? ""}
          defaultCategoryId={categoryId}
          allCategories={allCategories}
        />
      </section>
    </main>
  );
}
