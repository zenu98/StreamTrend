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
import type { Metadata } from "next";

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

  const [stats, liveStats, categoryInfo, allCategories, topStreamers] =
    await Promise.all([
      getGameStats(categoryId),
      getGameLiveStats(categoryId),
      getGameCategoryInfo(categoryId),
      getAllCategories(),
      getGameTopStreamers(categoryId),
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
          todayLabel={toKSTDateString(new Date())}
        />
      </section>

      <section className="space-y-4 ">
        <GameChartTabs
          allRows={stats.allRows}
          defaultGame={categoryInfo?.categoryValue ?? ""}
          defaultCategoryId={categoryId}
          allCategories={allCategories}
        />
      </section>
      {/* 역대 최고 시청자 랭킹 */}
      <section className="space-y-4">
        <GameTopStreamers
          topRecords={topStreamers.topRecords}
          topChannels={topStreamers.topChannels}
        />
      </section>
    </main>
  );
}
