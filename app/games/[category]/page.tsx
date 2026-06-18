import { Suspense } from "react";
import { getGameCategoryInfo, getGameStats } from "@/lib/gameStats";
import Image from "next/image";
import { ChartLineLabel } from "@/components/ui/charts/chart-line-label";
import { ChartRadialText } from "@/components/ui/charts/chart-radial-text";
import Link from "next/link";

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

  const [stats, categoryInfo] = await Promise.all([
    getGameStats(categoryId),
    getGameCategoryInfo(categoryId),
  ]);

  return (
    <main className="p-4 md:p-8 space-y-8">
      {/* 헤더 */}
      <div className="flex items-center gap-4 md:gap-6">
        {categoryInfo?.posterImageUrl && (
          <div className="relative w-16 h-24 md:w-24 md:h-32 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={categoryInfo.posterImageUrl}
              alt={categoryInfo.categoryValue}
              fill
              sizes="(max-width: 768px) 64px, 96px"
              className="object-cover"
            />
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-bold">
          {categoryInfo?.categoryValue}
        </h1>
      </div>

      {/* 현재 섹션 */}
      <section className="space-y-4">
        <h2 className="text-lg md:text-xl font-bold">현재</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ChartRadialText
            title="현재 시청자"
            value={stats.currentViewers}
            label="명"
            tier={stats.viewerTier}
          />
          <ChartRadialText
            title="현재 방송 수"
            value={stats.currentCount}
            label="개"
            tier={stats.countTier}
          />
          {stats.currentMaxViewer && (
            <Link href={`/streamers/${stats.currentMaxViewer.channelId}`}>
              <div className="flex flex-col items-center justify-center gap-2 p-4 h-full rounded-lg border bg-card hover:border-primary transition-colors">
                <p className="text-sm text-muted-foreground">
                  현재 최고 시청자
                </p>
                {stats.currentMaxViewer.channelImageUrl && (
                  <Image
                    src={stats.currentMaxViewer.channelImageUrl}
                    alt={stats.currentMaxViewer.channelName}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                )}
                <p className="text-sm font-bold">
                  {stats.currentMaxViewer.channelName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.currentMaxViewer.concurrentUserCount.toLocaleString()}
                  명
                </p>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* 역대 섹션 */}
      <section className="space-y-4">
        <h2 className="text-lg md:text-xl font-bold">역대</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ChartRadialText
            title="역대 최고 동시시청자"
            value={stats.maxViewers}
            tier={stats.viewerTier}
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

      {/* 시청자 수 추이 */}
      <section className="space-y-4">
        <h2 className="text-lg md:text-xl font-bold">시청자 수 추이</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ChartLineLabel
            title="주간"
            description="최근 7일"
            data={stats.weekly}
            dataKey="concurrentViewers"
          />
          <ChartLineLabel
            title="월간"
            description="최근 30일"
            data={stats.monthly}
            dataKey="concurrentViewers"
          />
          <ChartLineLabel
            title="연간"
            description="올해 월별"
            data={stats.yearly}
            dataKey="concurrentViewers"
          />
        </div>
      </section>

      {/* 방송 수 추이 */}
      <section className="space-y-4">
        <h2 className="text-lg md:text-xl font-bold">방송 수 추이</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ChartLineLabel
            title="주간"
            description="최근 7일"
            data={stats.weekly}
            dataKey="broadcastCount"
          />
          <ChartLineLabel
            title="월간"
            description="최근 30일"
            data={stats.monthly}
            dataKey="broadcastCount"
          />
          <ChartLineLabel
            title="연간"
            description="올해 월별"
            data={stats.yearly}
            dataKey="broadcastCount"
          />
        </div>
      </section>
    </main>
  );
}
