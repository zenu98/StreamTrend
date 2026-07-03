import { getStreamerAllStats, getStreamerStats } from "@/lib/streamerStats";
import Image from "next/image";
import { CategoryPieChart } from "@/components/ui/charts/chart-pie-legend";
import { ChartBarMixed } from "@/components/ui/charts/bar-chart-mixed";
import { Suspense } from "react";
import { ChartBarLabel } from "@/components/ui/charts/bar-chart-label";
import { StreamerDateFilter } from "@/components/shared/StreamerDataFilter";

async function StreamerDetail({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromise;
  const { today, weekly, monthly, channelInfo } = await getStreamerStats(id);
  const allRows = await getStreamerAllStats(id);
  console.log("today:", today);
  return (
    <main className="p-4 md:p-8 space-y-8">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        {channelInfo?.channelImageUrl ? (
          <Image
            src={channelInfo.channelImageUrl}
            alt={channelInfo.channelName}
            width={64}
            height={64}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl">
            {channelInfo?.channelName[0]}
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-bold">
          {channelInfo?.channelName}
        </h1>
      </div>
      {/* 당일 */}
      <section className="space-y-4">
        <h2 className="text-lg md:text-xl font-bold">오늘</h2>
        {today.length === 0 ? (
          <p className="text-sm text-muted-foreground">데이터 없음</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
            <ChartBarLabel
              title="시청자 수"
              description="게임별 시청자 수"
              data={today}
              dataKey="avgViewers"
            />
            <CategoryPieChart
              title="방송 수"
              description="게임별 방송 수"
              data={today}
              dataKey="count"
            />
          </div>
        )}
      </section>
      <StreamerDateFilter rows={allRows} />
    </main>
  );
}

export default function StreamerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={<div className="p-8 text-muted-foreground">로딩 중...</div>}
    >
      <StreamerDetail paramsPromise={params} />
    </Suspense>
  );
}
