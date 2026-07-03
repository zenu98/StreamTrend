"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";

type Streamer = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  maxViewers: number;
};

type Game = {
  category: string;
  categoryId: string;
  concurrentViewers: number;
  maxViewers: number;
  peakViewers: number;
  posterImageUrl: string | null;
  topStreamer: Streamer | null;
};

type Props = {
  byConcurrent: Game[];
  byMax: Game[];
  byPeak: Game[];
};

const tabs = [
  { label: "평균 시청자", key: "byConcurrent" as const },
  { label: "최고 동시시청자", key: "byMax" as const },
  { label: "최고 시청자", key: "byPeak" as const },
];

const valueConfig = {
  byConcurrent: { key: "concurrentViewers" as const, label: "평균" },
  byMax: { key: "maxViewers" as const, label: "최고 동시" },
  byPeak: { key: "peakViewers" as const, label: "최고" },
};

function PodiumItem({
  game,
  rank,
  showStreamer,
  valueKey,
}: {
  game: Game;
  rank: number;
  showStreamer: boolean;
  valueKey: "concurrentViewers" | "maxViewers" | "peakViewers";
}) {
  const router = useRouter();
  const isFirst = rank === 1;
  const borderColor =
    rank === 1 ? "#f59e0b" : rank === 2 ? "#9ca3af" : "#b45309";
  const badgeBg = rank === 1 ? "#fef3c7" : rank === 2 ? "#f3f4f6" : "#fef3c7";
  const badgeBorder =
    rank === 1 ? "#f59e0b" : rank === 2 ? "#9ca3af" : "#b45309";
  const badgeColor =
    rank === 1 ? "#92400e" : rank === 2 ? "#374151" : "#78350f";
  const imgWidth = isFirst ? "w-72" : "w-64";

  return (
    <div
      className={`flex flex-col items-center gap-2 ${!isFirst ? "mt-10" : ""}`}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
        style={{
          background: badgeBg,
          border: `0.5px solid ${badgeBorder}`,
          color: badgeColor,
        }}
      >
        {rank}
      </div>
      <div
        onClick={() =>
          router.push(`/games/${encodeURIComponent(game.categoryId)}`)
        }
        className="cursor-pointer ..."
      >
        <div
          className={`${imgWidth} aspect-[3/4] rounded-xl overflow-hidden relative flex-shrink-0`}
          style={{ border: `3px solid ${borderColor}` }}
        >
          {game.posterImageUrl ? (
            <Image
              src={game.posterImageUrl}
              alt={game.category}
              fill
              className="object-cover"
              sizes="192px"
              priority
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
          {/* 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/60" />

          {/* 가운데 숫자 */}
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-1">
            <span className="text-6xl text-gray-200 leading-none [font-family:var(--font-anton)] tracking-wider">
              {game[valueKey].toLocaleString()}
            </span>
            {/* <span className="text-xs text-white/60">명</span> */}
          </div>

          {/* 하단 게임명 + 스트리머 */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-sm font-medium text-white truncate mb-2">
              {game.category}
            </p>
            {showStreamer && game.topStreamer && (
              <Link
                href={`/streamers/${game.topStreamer.channelId}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden relative border border-white/30 flex-shrink-0">
                    {game.topStreamer.channelImageUrl ? (
                      <Image
                        src={game.topStreamer.channelImageUrl}
                        alt={game.topStreamer.channelName}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-white">
                        {game.topStreamer.channelName[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-white/80 truncate">
                    {game.topStreamer.channelName}
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
      <p className="text-sm font-medium text-center max-w-[90px] truncate">
        {game.category}
      </p>
    </div>
  );
}

export function TrendingGame({ byConcurrent, byMax, byPeak }: Props) {
  const [active, setActive] = useState<"byConcurrent" | "byMax" | "byPeak">(
    "byConcurrent",
  );

  const games =
    active === "byConcurrent"
      ? byConcurrent
      : active === "byMax"
        ? byMax
        : byPeak;
  const { key: valueKey, label: valueLabel } = valueConfig[active];
  const showStreamer = active === "byPeak";

  const top3 = games.slice(0, 3);
  const rest = games.slice(3, 11);
  const podiumOrder = [top3[1], top3[0], top3[2]];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 탭 */}

      <div className="text-center mt-16 mb-8">
        <h1 className="text-6xl font-extrabold text-white">트렌딩 게임</h1>
        <div className="flex items-center justify-center gap-1 mt-2">
          <p className="text-sm text-white/40 ">최근 7일간 시청자 기준</p>
          <div className="relative group">
            <Info className="w-4 h-4 text-white/30 cursor-help -translate-y-px" />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 rounded-lg bg-white/10 backdrop-blur-sm text-xs text-white/70 hidden group-hover:block z-10 text-left space-y-1.5">
              <p>· 오늘 데이터는 제외됩니다 (매일 06:00 집계)</p>
              <p>
                · 평균 동시시청자 = 수집 시점별 전체 시청자 합산 ÷ 수집 횟수
              </p>
              <p>· 최고 동시시청자 = 하루 중 전체 시청자 합산 최고값</p>
              <p>· 최고 시청자 = 단일 방송 최고 시청자</p>
              <p>· 상위 2,000개 방송 기준으로 5분마다 수집됩니다</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
              active === tab.key
                ? "bg-white/10 text-white border-white/30 backdrop-blur-sm"
                : "bg-transparent border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 포디움 */}
      <div className="flex justify-center items-start gap-8">
        {podiumOrder.map((game, idx) => {
          const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
          return (
            <PodiumItem
              key={`podium-${game.categoryId}`}
              game={game}
              rank={rank}
              showStreamer={showStreamer}
              valueKey={valueKey}
            />
          );
        })}
      </div>

      {/* 4~10위 리스트 */}
      {/* 4~10위 카드 그리드 */}
      <div className="grid grid-cols-4 gap-3">
        {rest.map((game, idx) => (
          <Link
            key={`list-${game.categoryId}`}
            href={`/games/${encodeURIComponent(game.categoryId)}`}
            className="relative aspect-3/4 rounded-xl overflow-hidden group"
          >
            {/* 배경 이미지 */}
            {game.posterImageUrl ? (
              <Image
                src={game.posterImageUrl}
                alt={game.category}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="10vw"
              />
            ) : (
              <div className="absolute inset-0 bg-muted" />
            )}

            {/* 오버레이 */}
            <div className="absolute inset-0 bg-linear-to-b from-transparent  via-black/40 to-black/60" />

            {/* 순위 뱃지 */}
            <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
              {idx + 4}
            </div>

            {/* 가운데 숫자 */}
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-1">
              <span className="text-6xl font-bold text-gray-200 leading-none [font-family:var(--font-anton)] tracking-widest">
                {game[valueKey].toLocaleString()}
              </span>
              {/* <span className="text-xs text-white/60">명</span> */}
            </div>

            {/* 하단 게임명 + 스트리머 */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-sm font-medium text-white truncate mb-2">
                {game.category}
              </p>
              {showStreamer && game.topStreamer && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden relative border border-white/30 flex-shrink-0">
                    {game.topStreamer.channelImageUrl ? (
                      <Image
                        src={game.topStreamer.channelImageUrl}
                        alt={game.topStreamer.channelName}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-white">
                        {game.topStreamer.channelName[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-white/80 truncate">
                    {game.topStreamer.channelName}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
