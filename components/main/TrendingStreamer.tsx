"use client";

import { Suspense, use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Info } from "lucide-react";
import { LiveStreamer } from "@/lib/stats";

type Streamer = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  totalViewers: number;
  maxViewers: number;
  broadcastCount: number;
  topGames: string[];
  liveTitle?: string;
};

type Props = {
  streamers: Streamer[];
  liveStreamerPromise: Promise<LiveStreamer[]>;
};

function avgViewers(s: Streamer) {
  return s.totalViewers > 0 && s.broadcastCount > 0
    ? Math.round(s.totalViewers / s.broadcastCount)
    : 0;
}

function BlurBg({ url }: { url: string | null }) {
  if (!url) return <div className="absolute inset-0 bg-white/10" />;
  return (
    <Image
      src={url}
      alt=""
      fill
      className="object-cover"
      sizes="100vw"
      style={{ filter: "blur(1px) brightness(0.35)" }}
    />
  );
}

function ProfileCircle({
  url,
  name,
  borderColor,
}: {
  url: string | null;
  name: string;
  borderColor?: string;
}) {
  return (
    <div
      className="w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden flex-shrink-0"
      style={{
        border: borderColor
          ? `2px solid ${borderColor}`
          : "2px solid rgba(255,255,255,0.2)",
      }}
    >
      {url ? (
        <Image
          src={url}
          alt={name}
          width={64}
          height={64}
          className="object-cover w-full h-full"
        />
      ) : (
        <div className="w-full h-full bg-white/10 flex items-center justify-center text-white text-sm">
          {name[0]}
        </div>
      )}
    </div>
  );
}

function StreamerCard({
  streamer,
  viewers,
  subText,
  borderColor,
  className,
  viewerClassName,
  nameClassName,
  subClassName,
}: {
  streamer: Streamer;
  viewers: number;
  subText: string;
  borderColor?: string;
  className?: string;
  viewerClassName?: string;
  nameClassName?: string;
  subClassName?: string;
}) {
  return (
    <Link
      href={`/streamers/${streamer.channelId}`}
      className={`relative overflow-hidden ${className}`}
      style={borderColor ? { borderColor } : undefined}
    >
      <BlurBg url={streamer.channelImageUrl} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute inset-0 flex items-center gap-3 px-3">
        <ProfileCircle
          url={streamer.channelImageUrl}
          name={streamer.channelName}
          borderColor={borderColor}
        />
        <div className="min-w-0 flex-1">
          <p className={`text-white font-bold truncate ${nameClassName ?? ""}`}>
            {streamer.channelName}
          </p>
          <p
            className={`text-white/60 font-semibold truncate ${subClassName ?? ""}`}
          >
            {subText}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p
            className={`text-white leading-none ${viewerClassName}`}
            style={{ fontFamily: "var(--font-anton)" }}
          >
            {viewers.toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}

function StreamerList({
  streamers,
  isLive,
}: {
  streamers: Streamer[];
  isLive: boolean;
}) {
  const top3 = streamers.slice(0, 3);
  const rest = streamers.slice(3, 9);

  function getViewers(s: Streamer) {
    return isLive ? s.totalViewers : avgViewers(s);
  }

  function getSubText(s: Streamer) {
    return isLive && s.liveTitle ? s.liveTitle : s.topGames.join(" · ");
  }

  return (
    <div className="space-y-2">
      {top3[0] && (
        <StreamerCard
          streamer={top3[0]}
          viewers={getViewers(top3[0])}
          subText={getSubText(top3[0])}
          borderColor="#f59e0b"
          className="flex h-28 md:h-48 rounded-2xl border-2"
          nameClassName="md:text-2xl"
          subClassName="text-xs md:text-sm"
          viewerClassName="text-3xl md:text-6xl"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2  gap-2">
        {[top3[1], top3[2]].map((streamer, i) => {
          if (!streamer) return null;
          const rank = i + 2;
          const borderColor = rank === 2 ? "#9ca3af" : "#b45309";
          return (
            <StreamerCard
              key={streamer.channelId}
              streamer={streamer}
              viewers={getViewers(streamer)}
              subText={getSubText(streamer)}
              borderColor={borderColor}
              className="h-24 md:h-40 rounded-xl border-2"
              nameClassName="md:text-xl"
              subClassName="text-xs md:text-sm"
              viewerClassName="text-3xl md:text-5xl"
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {rest.map((streamer) => (
          <StreamerCard
            key={streamer.channelId}
            streamer={streamer}
            viewers={getViewers(streamer)}
            subText={getSubText(streamer)}
            className="h-20 md:h-36 rounded-xl"
            nameClassName="md:text-lg"
            subClassName="text-xs"
            viewerClassName="text-2xl md:text-4xl"
          />
        ))}
      </div>
    </div>
  );
}

function LiveStreamerContent({
  liveStreamerPromise,
}: {
  liveStreamerPromise: Promise<LiveStreamer[]>;
}) {
  const streamers = use(liveStreamerPromise);
  return <StreamerList streamers={streamers} isLive={true} />;
}

export function TrendingStreamer({ streamers, liveStreamerPromise }: Props) {
  const [active, setActive] = useState<"average" | "live">("average");

  const tabs = [
    { label: "실시간 시청자", key: "live" as const },
    { label: "평균 시청자", key: "average" as const },
  ];

  return (
    <section className="space-y-0 w-full px-4 md:px-0">
      <div className="text-center mt-8 md:mt-16 mb-4 md:mb-8">
        <h1 className="text-4xl mb-4 md:text-6xl font-extrabold text-white">
          트렌딩 스트리머
        </h1>
        <div className="flex items-center justify-center gap-1 mt-2">
          <p className="text-xs md:text-sm text-white/40">
            {active === "live"
              ? "실시간 동시시청자 기준"
              : "최근 3일간 평균 시청자 기준"}
          </p>
          <div className="relative group">
            <Info className="w-4 h-4 text-white/30 cursor-help -translate-y-px" />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 md:w-72 p-3 rounded-lg bg-white/10 backdrop-blur-sm text-xs text-white/70 hidden group-hover:block z-10 text-left space-y-1.5">
              {active === "live" ? (
                <>
                  <p>· 5분마다 자동 갱신되는 실시간 데이터예요</p>
                  <p>· 상위 2,000개 방송 기준으로 집계됩니다</p>
                </>
              ) : (
                <>
                  <p>· 오늘 데이터는 제외됩니다 (매일 06:00 집계)</p>
                  <p>· 평균 시청자 = 누적 시청자 합산 ÷ 수집 횟수</p>
                  <p>· 게임/스포츠/토크 전체 카테고리 포함</p>
                  <p>· 상위 2,000개 방송 기준으로 5분마다 수집됩니다</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-center flex-wrap mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm border transition-colors ${
              active === tab.key
                ? "bg-white/10 text-white border-white/30 backdrop-blur-sm"
                : "bg-transparent border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === "live" ? (
        <Suspense
          fallback={
            <p className="text-center text-sm text-white/40 py-12">
              불러오는 중...
            </p>
          }
        >
          <LiveStreamerContent liveStreamerPromise={liveStreamerPromise} />
        </Suspense>
      ) : (
        <StreamerList streamers={streamers} isLive={false} />
      )}
    </section>
  );
}
