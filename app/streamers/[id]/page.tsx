import {
  getStreamerAllStats,
  getStreamerStats,
  getStreamerTopRecords,
} from "@/lib/streamerStats";
import Image from "next/image";
import { Suspense } from "react";
import { StreamerDateFilter } from "@/components/streamer/StreamerDataFilter";
import { StreamerTopRecords } from "@/components/streamer/StreamerTopRecords";
import type { Metadata } from "next";
import { getStreamerBasicInfo } from "@/lib/streamerStats";

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

  const [{ today, channelInfo }, allRows, topRecordsData] = await Promise.all([
    getStreamerStats(id),
    getStreamerAllStats(id),
    getStreamerTopRecords(id),
  ]);

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

      {/* 통계 (실시간 기본 선택) */}
      <section className="space-y-4">
        <h2 className="text-lg md:text-xl font-bold">통계</h2>
        <StreamerDateFilter rows={allRows} todayRows={today} />
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
