import { Suspense } from "react";
import { getGameCategoryInfo, getGameStats } from "@/lib/gameStats";
import Image from "next/image";
import { ChartLineLabel } from "@/components/ui/charts/chart-line-label";

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

      <section className="space-y-4">
        <h2 className="text-lg md:text-xl font-bold">시청자 수 추이</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ChartLineLabel
            title="주간"
            description="최근 7일"
            data={stats.weekly}
            dataKey="totalViewers"
          />
          <ChartLineLabel
            title="월간"
            description="최근 30일"
            data={stats.monthly}
            dataKey="totalViewers"
          />
          <ChartLineLabel
            title="연간"
            description="올해 월별"
            data={stats.yearly}
            dataKey="totalViewers"
          />
        </div>
      </section>

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
