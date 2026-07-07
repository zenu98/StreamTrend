import { Suspense } from "react";
import {
  getGameCategoryInfo,
  getGameLiveStats,
  getGameStats,
} from "@/lib/gameStats";
import Image from "next/image";
import { ChartLineLabel } from "@/components/ui/charts/chart-line-label";
import { ChartRadialText } from "@/components/ui/charts/chart-radial-text";
import Link from "next/link";
import { getLives } from "@/lib/lives";
import { getStatsByDate } from "@/lib/stats";
import { GameCompareChart } from "@/components/shared/GameCompareChart";
import { GameTrendChart } from "@/components/shared/GameTrendChart";
import { GameChartTabs } from "@/components/shared/GameChartTabs";
import { getAllCategories } from "@/lib/games";

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

  const [stats, liveStats, categoryInfo, allCategories] = await Promise.all([
    getGameStats(categoryId),
    getGameLiveStats(categoryId),
    getGameCategoryInfo(categoryId),
    getAllCategories(),
  ]);

  return (
    <main className="p-4 md:p-8 space-y-8">
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

      {/* 현재 섹션 */}
      <section className="space-y-4">
        <h2 className="text-lg md:text-xl font-bold">현재</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ChartRadialText
            title="현재 시청자"
            value={liveStats.currentViewers}
            label="명"
            tier={liveStats.viewerTier}
          />
          <ChartRadialText
            title="현재 방송 수"
            value={liveStats.currentCount}
            label="개"
            tier={liveStats.countTier}
          />
          {liveStats.currentMaxViewer && (
            <Link href={`/streamers/${liveStats.currentMaxViewer.channelId}`}>
              <div className="flex flex-col items-center justify-center gap-2 p-4 h-full rounded-lg border bg-card hover:border-primary transition-colors">
                <p className="text-sm text-muted-foreground">
                  현재 최고 시청자
                </p>
                {liveStats.currentMaxViewer.channelImageUrl && (
                  <Image
                    src={liveStats.currentMaxViewer.channelImageUrl}
                    alt={liveStats.currentMaxViewer.channelName}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                )}
                <p className="text-sm font-bold">
                  {liveStats.currentMaxViewer.channelName}
                </p>
                <p className="text-sm ">
                  {liveStats.currentMaxViewer.liveTitle}
                </p>

                <p className="text-xs text-muted-foreground">
                  {liveStats.currentMaxViewer.concurrentUserCount.toLocaleString()}
                  명
                </p>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* 역대 섹션 */}
      <section className="space-y-4 ">
        <h2 className="text-lg md:text-xl font-bold">역대</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ChartRadialText
            title="역대 최고 동시시청자"
            value={stats.maxViewers}
            tier={liveStats.viewerTier}
          />
          {stats.allTimeTopStreamer && (
            <Link href={`/streamers/${stats.allTimeTopStreamer.channelId}`}>
              <div className="flex flex-col items-center justify-center gap-2 p-4 h-full rounded-lg border bg-card hover:border-primary transition-colors">
                <p className="text-sm text-muted-foreground">
                  역대 최고 시청자
                </p>
                {stats.allTimeTopStreamer.channelImageUrl && (
                  <Image
                    src={stats.allTimeTopStreamer.channelImageUrl}
                    alt={stats.allTimeTopStreamer.channelName}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                )}
                <p className="text-sm font-bold">
                  {stats.allTimeTopStreamer.channelName}
                </p>
                <p className="text-sm ">{stats.allTimeTopStreamer.liveTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.allTimeTopStreamer.maxViewers.toLocaleString()}명
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(
                    stats.allTimeTopStreamer.date.getTime() +
                      9 * 60 * 60 * 1000,
                  )
                    .toISOString()
                    .slice(0, 10)}
                </p>
              </div>
            </Link>
          )}
        </div>
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
