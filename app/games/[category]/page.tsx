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
import { getTodayLabel, toKSTDateString } from "@/lib/utils";
import type { Metadata } from "next";
import { get7DaysAllGames } from "@/lib/stats";
import { GameScoreCard } from "@/components/game/GameScoreCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categoryId = decodeURIComponent(category);
  const categoryInfo = await getGameCategoryInfo(categoryId);

  if (!categoryInfo) return {};

  const title = `${categoryInfo.categoryValue} 실시간 시청자 순위`;
  const description = `치지직 ${categoryInfo.categoryValue} 카테고리의 실시간 시청자 수, 방송 수, 역대 최고 기록을 확인하세요.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: categoryInfo.posterImageUrl
        ? [categoryInfo.posterImageUrl]
        : undefined,
    },
    alternates: {
      canonical: `/games/${encodeURIComponent(categoryId)}`,
    },
  };
}
export default function GameDetailPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  return <GameDetail paramsPromise={params} />;
}

async function GameDetail({
  paramsPromise,
}: {
  paramsPromise: Promise<{ category: string }>;
}) {
  const { category } = await paramsPromise;
  const categoryId = decodeURIComponent(category);
  const [
    stats,
    liveStats,
    categoryInfo,
    allCategories,
    topStreamers,
    weeklyGames,
  ] = await Promise.all([
    getGameStats(categoryId),
    getGameLiveStats(categoryId),
    getGameCategoryInfo(categoryId),
    getAllCategories(),
    getGameTopStreamers(categoryId),
    get7DaysAllGames(),
  ]);
  return (
    <main className="p-4  mx-auto w-full  space-y-8 ">
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

      <section className="flex-col space-y-4">
        {/* <h2 className="text-lg md:text-xl font-bold">현재</h2> */}
        {!stats.isNonGame && (
          <GameScoreCard
            categoryId={categoryId}
            allRows={stats.allRows}
            allGames={weeklyGames.allGames}
          />
        )}

        <AllTimeRecordCard
          maxViewers={stats.maxViewers}
          maxViewersDate={stats.maxViewersDate}
        />
        <CurrentStatsStrip
          currentViewers={liveStats.currentViewers}
          currentCount={liveStats.currentCount}
          viewerTier={liveStats.viewerTier}
          countTier={liveStats.countTier}
          currentMaxViewer={liveStats.currentMaxViewer}
          topLiveStreamers={liveStats.topLiveStreamers}
        />
      </section>

      <section className="space-y-4">
        {/* <h2 className="text-lg md:text-xl font-bold">역대</h2> */}
        {/* <AllTimeRecordCard
          maxViewers={stats.maxViewers}
          maxViewersDate={stats.maxViewersDate}
        /> */}
      </section>

      <section className="space-y-4">
        <ViewerConcentrationSection
          viewerPercentile={liveStats.viewerPercentile}
          countPercentile={liveStats.countPercentile}
          viewerRank={liveStats.viewerRank}
          // countRank={liveStats.countRank}
          viewerTieCount={liveStats.viewerTieCount}
          countTieCount={liveStats.countTieCount}
          totalGames={liveStats.totalGames}
          totalCountAll={liveStats.totalCountAll}
          viewerShare={liveStats.viewerShare}
          countShare={liveStats.countShare}
          currentCount={liveStats.currentCount}
          // topStreamerViewers={liveStats.currentMaxViewer?.concurrentUserCount}
          trendRows={stats.allRows}
          currentViewers={liveStats.currentViewers}
          todayLabel={getTodayLabel()}
        />
      </section>

      <section className="space-y-4 ">
        <h2 className="flex items-center gap-2 text-lg md:text-xl font-bold">
          <span
            className="w-1 h-5 md:h-6 rounded-full"
            style={{ background: "var(--chart-1)" }}
          />
          시청자 통계
        </h2>
        <GameChartTabs
          allRows={stats.allRows}
          defaultGame={categoryInfo?.categoryValue ?? ""}
          defaultCategoryId={categoryId}
          allCategories={allCategories}
          liveStats={{
            currentViewers: liveStats.currentViewers,
            currentCount: liveStats.currentCount,
          }}
          topStreamersByDate={stats.topStreamersByDate}
        />
      </section>
      {/* 역대 최고 시청자 랭킹 */}
      <section className="space-y-4">
        <GameTopStreamers
          topRecords={topStreamers.topRecords}
          topChannels={topStreamers.topChannels}
          categoryId={categoryId}
          defaultDisplayLimit={topStreamers.defaultDisplayLimit}
        />
      </section>
    </main>
  );
}
