import {
  getStreamerAllStats,
  getStreamerStats,
  getStreamerTopRecords,
  getStreamerTrend,
} from "@/lib/streamerStats";
import Image from "next/image";
import { Suspense } from "react";
import { StreamerDateFilter } from "@/components/streamer/StreamerDataFilter";
import { StreamerTopRecords } from "@/components/streamer/StreamerTopRecords";
import type { Metadata } from "next";
import { getStreamerBasicInfo } from "@/lib/streamerStats";
import { StreamerTrendChart } from "@/components/streamer/StreamerTrendChart";
import { StreamerCurrentStats } from "@/components/streamer/StreamerCurrentStats";
import { StreamerMainGame } from "@/components/streamer/StreamerMainGame";
import { BroadcastCalendar } from "@/components/streamer/BroadcastCalendar";
import { StreamerGameCalendar } from "@/components/streamer/StreamerGameCalendar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const info = await getStreamerBasicInfo(id);

  if (!info) return {};

  const title = `${info.channelName} 방송 통계`;
  const description = `${info.channelName}님의 실시간 시청자, 게임별 방송 비중, 역대 최고 기록을 확인하세요.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: info.channelImageUrl ? [info.channelImageUrl] : undefined,
    },
    alternates: {
      canonical: `/streamers/${id}`,
    },
  };
}
async function StreamerDetail({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromise;

  const [{ today, channelInfo }, allRows, topRecordsData, trendRows] =
    await Promise.all([
      getStreamerStats(id),
      getStreamerAllStats(id),
      getStreamerTopRecords(id),
      getStreamerTrend(id),
    ]);

  return (
    <main className="p-4 md:p-8 space-y-8 ">
      {/* 헤더 */}

      <div className="flex items-center gap-4">
        {channelInfo?.channelImageUrl ? (
          <a
            href={`https://chzzk.naver.com/live/${id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src={channelInfo.channelImageUrl}
              alt={channelInfo.channelName}
              width={64}
              height={64}
              className="rounded-full object-cover"
            />
          </a>
        ) : (
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl">
            {channelInfo?.channelName[0]}
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-bold">
          {channelInfo?.channelName}
        </h1>
      </div>
      <section className="space-y-4">
        <StreamerCurrentStats
          todayGames={today.map((d) => ({
            category: d.category,
            categoryId: d.categoryId,
            count: d.count,
            totalViewers: d.totalViewers,
          }))}
        />
      </section>

      <section className="space-y-4">
        <StreamerMainGame rows={allRows} />
      </section>
      <section className="space-y-4">
        <StreamerTrendChart trendRows={trendRows} />
      </section>
      <section className="space-y-4">
        <BroadcastCalendar trendRows={trendRows} gameRows={allRows} />
      </section>
      {/* 통계 (실시간 기본 선택) */}
      <section className="space-y-4">
        <StreamerDateFilter rows={allRows} />
      </section>

      {/* 역대 최고 시청자 기록 */}
      <section className="space-y-4">
        <StreamerTopRecords
          topRecords={topRecordsData.topRecords}
          topGames={topRecordsData.topGames}
        />
      </section>
    </main>
  );
}

export default function StreamerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <StreamerDetail paramsPromise={params} />;
}
