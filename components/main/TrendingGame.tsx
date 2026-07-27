"use client";

import { Suspense, use, useState } from "react";
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
  totalViewers?: number;
  posterImageUrl: string | null;
  topStreamer: Streamer | null;
};

type LiveData = {
  byLive: Game[];
  collectedAt: string;
};

type Props = {
  livePromise: Promise<LiveData>;
  byMax: Game[];
  byPeak: Game[];
};

type ValueKey =
  | "concurrentViewers"
  | "maxViewers"
  | "peakViewers"
  | "totalViewers";

const tabs = [
  { label: "실시간 시청자", key: "byLive" as const },
  { label: "최고 동시시청자", key: "byMax" as const },
  { label: "최고 시청자", key: "byPeak" as const },
];

const valueConfig: Record<
  "byMax" | "byPeak",
  { key: ValueKey; label: string }
> = {
  byMax: { key: "maxViewers", label: "최고 동시" },
  byPeak: { key: "peakViewers", label: "최고" },
};

function formatCollectedAt(collectedAt: string) {
  return new Date(collectedAt).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PodiumItem({
  game,
  rank,
  showStreamer,
  valueKey,
}: {
  game: Game;
  rank: number;
  showStreamer: boolean;
  valueKey: ValueKey;
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
  const imgWidth = isFirst ? "w-32 md:w-56 lg:w-72" : "w-24 md:w-48 lg:w-64";
  const value = game[valueKey] ?? 0;

  return (
    <div
      className={`flex flex-col items-center gap-2 ${!isFirst ? "mt-6 md:mt-10" : ""}`}
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
        className="cursor-pointer"
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
              sizes="(max-width: 768px) 128px, (max-width: 1024px) 224px, 288px"
              priority
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-1">
            <span className="text-2xl md:text-5xl lg:text-6xl text-gray-200 leading-none [font-family:var(--font-anton)] tracking-wider">
              {value.toLocaleString()}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
            <p className="text-xs md:text-sm font-bold text-white/90 truncate mb-1 md:mb-2">
              {game.category}
            </p>
            {showStreamer && game.topStreamer && (
              <Link
                href={`/streamers/${game.topStreamer.channelId}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1 md:gap-2">
                  <div className="w-5 h-5 md:w-8 md:h-8 rounded-full overflow-hidden relative border border-white/30 flex-shrink-0">
                    {game.topStreamer.channelImageUrl ? (
                      <Image
                        src={game.topStreamer.channelImageUrl}
                        alt={game.topStreamer.channelName}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-xs font-bold text-white">
                        {game.topStreamer.channelName[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] md:text-xs font-semibold text-white/90 truncate">
                    {game.topStreamer.channelName}
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GameRankingBody({
  games,
  showStreamer,
  valueKey,
}: {
  games: Game[];
  showStreamer: boolean;
  valueKey: ValueKey;
}) {
  const top3 = games.slice(0, 3);
  const rest = games.slice(3, 12);
  const podiumOrder = [top3[1], top3[0], top3[2]];

  if (games.length === 0) {
    return (
      <p className="text-center text-sm text-white/40 py-12">데이터가 없어요</p>
    );
  }

  return (
    <>
      {/* ── 모바일 전용 레이아웃 ── */}
      <div className="md:hidden space-y-2">
        {/* 1위 — 가로 배너 */}
        {top3[0] && (
          <Link
            href={`/games/${encodeURIComponent(top3[0].categoryId)}`}
            className="relative flex h-32 overflow-hidden rounded-2xl border-2"
            style={{ borderColor: "#f59e0b" }}
          >
            {top3[0].posterImageUrl ? (
              <Image
                src={top3[0].posterImageUrl}
                alt={top3[0].category}
                fill
                className="object-cover "
                sizes="100vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-muted" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/20" />
            <div className="absolute inset-0 flex items-center gap-4 px-4">
              {/* <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: "#f59e0b", color: "#000" }}
              >
                1
              </div> */}
              <div className="min-w-0">
                <p className="text-white/90 font-bold text-sm truncate">
                  {top3[0].category}
                </p>
                <p
                  className="text-white text-4xl leading-none mt-0.5"
                  style={{ fontFamily: "var(--font-anton)" }}
                >
                  {(top3[0][valueKey] ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* 2·3위 — 2열 카드 */}
        <div className="grid grid-cols-2 gap-2">
          {[top3[1], top3[2]].map((game, i) => {
            if (!game) return null;
            const rank = i + 2;
            const borderColor = rank === 2 ? "#9ca3af" : "#b45309";
            const badgeBg = rank === 2 ? "#9ca3af" : "#b45309";
            const badgeTextColor = rank === 2 ? "#000" : "#fff";
            return (
              <Link
                key={game.categoryId}
                href={`/games/${encodeURIComponent(game.categoryId)}`}
                className="relative h-28 overflow-hidden rounded-xl border-2"
                style={{ borderColor }}
              >
                {game.posterImageUrl ? (
                  <Image
                    src={game.posterImageUrl}
                    alt={game.category}
                    fill
                    className="object-cover"
                    sizes="50vw"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
                {/* <div
                  className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: badgeBg, color: badgeTextColor }}
                >
                  {rank}
                </div> */}
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white/90 font-bold text-xs truncate">
                    {game.category}
                  </p>
                  <p
                    className="text-white text-2xl leading-tight"
                    style={{ fontFamily: "var(--font-anton)" }}
                  >
                    {(game[valueKey] ?? 0).toLocaleString()}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 4~9위 — 2열 콤팩트 카드 */}
        <div className="grid grid-cols-2 gap-2">
          {rest.slice(0, 6).map((game, idx) => (
            <Link
              key={game.categoryId}
              href={`/games/${encodeURIComponent(game.categoryId)}`}
              className="relative h-24 overflow-hidden rounded-xl"
            >
              {game.posterImageUrl ? (
                <Image
                  src={game.posterImageUrl}
                  alt={game.category}
                  fill
                  className="object-cover"
                  sizes="50vw"
                />
              ) : (
                <div className="absolute inset-0 bg-muted" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
              {/* <div className="absolute top-1.5 left-2 text-white/50 text-[10px] font-semibold">
                {idx + 4}위
              </div> */}
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white/90 text-[10px] truncate font-semibold">
                  {game.category}
                </p>
                <p
                  className="text-white text-xl leading-tight"
                  style={{ fontFamily: "var(--font-anton)" }}
                >
                  {(game[valueKey] ?? 0).toLocaleString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── 데스크톱 기존 레이아웃 ── */}
      <div className="hidden md:block space-y-6">
        <div className="flex justify-center items-start gap-8">
          {podiumOrder.map((game, idx) => {
            if (!game) return null;
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

        <div className="grid grid-cols-4 gap-3">
          {rest.map((game, idx) => (
            <Link
              key={`list-${game.categoryId}`}
              href={`/games/${encodeURIComponent(game.categoryId)}`}
              className="relative aspect-3/4 rounded-xl overflow-hidden group"
            >
              {game.posterImageUrl ? (
                <Image
                  src={game.posterImageUrl}
                  alt={game.category}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="25vw"
                />
              ) : (
                <div className="absolute inset-0 bg-muted" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/80" />
              <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                {idx + 4}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-5xl lg:text-6xl text-gray-200 leading-none tracking-widest"
                  style={{ fontFamily: "var(--font-anton)" }}
                >
                  {(game[valueKey] ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-sm font-bold text-white/90 truncate mb-2">
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
                          sizes="32px"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-white">
                          {game.topStreamer.channelName[0]}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-white/90 truncate">
                      {game.topStreamer.channelName}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
function LiveSubtitle({ livePromise }: { livePromise: Promise<LiveData> }) {
  const { collectedAt } = use(livePromise);
  return (
    <>
      <p className="text-xs md:text-sm text-white/40">
        {formatCollectedAt(collectedAt)} 기준
      </p>

      <div className="relative group">
        <Info className="w-4 h-4 text-white/30 cursor-help -translate-y-px" />
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 md:w-72 p-3 rounded-lg bg-white/10 backdrop-blur-sm text-xs text-white/70 hidden group-hover:block z-10 text-left space-y-1.5">
          <p>· 5분마다 자동 갱신되는 실시간 데이터예요</p>
          <p>· 탭을 열 때의 최신 수집 시점 기준이에요</p>
          <p>· 상위 2,000개 방송 기준으로 집계됩니다</p>
        </div>
      </div>
    </>
  );
}
function LiveTabContent({ livePromise }: { livePromise: Promise<LiveData> }) {
  const { byLive, collectedAt } = use(livePromise);
  return (
    <GameRankingBody
      games={byLive}
      showStreamer={false}
      valueKey="totalViewers"
    />
  );
}

export function TrendingGame({ livePromise, byMax, byPeak }: Props) {
  const [active, setActive] = useState<"byLive" | "byMax" | "byPeak">("byMax");
  const showStreamer = active === "byPeak";
  const isLive = active === "byLive";

  return (
    <section className=" space-y-6 px-4 md:px-0">
      <div className="text-center mt-8 md:mt-16 mb-4 md:mb-8">
        <h1 className="text-4xl mb-4 md:text-6xl font-extrabold text-white">
          트렌딩 게임
        </h1>
        <div className="flex items-center justify-center gap-1 mt-2">
          {isLive ? (
            <Suspense
              fallback={
                <p className="text-xs md:text-sm text-white/40">
                  불러오는 중...
                </p>
              }
            >
              <LiveSubtitle livePromise={livePromise} />
            </Suspense>
          ) : (
            <>
              <p className="text-xs md:text-sm text-white/40">
                최근 3일간 시청자 기준
              </p>
              <div className="relative group">
                <Info className="w-4 h-4 text-white/30 cursor-help -translate-y-px" />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 md:w-72 p-3 rounded-lg bg-white/10 backdrop-blur-sm text-xs text-white/70 hidden group-hover:block z-10 text-left space-y-1.5">
                  <p>· 오늘 데이터는 제외됩니다 (매일 06:00 집계)</p>
                  <p>· 최고 동시시청자 = 하루 중 전체 시청자 합산 최고값</p>
                  <p>· 최고 시청자 = 단일 방송 최고 시청자</p>
                  <p>· 상위 2,000개 방송 기준으로 5분마다 수집됩니다</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
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

      {isLive ? (
        <Suspense
          fallback={
            <p className="text-center text-sm text-white/40 py-12">
              불러오는 중...
            </p>
          }
        >
          <LiveTabContent livePromise={livePromise} />
        </Suspense>
      ) : (
        <GameRankingBody
          games={active === "byMax" ? byMax : active === "byPeak" ? byPeak : []}
          showStreamer={showStreamer}
          valueKey={
            active === "byMax"
              ? "maxViewers"
              : active === "byPeak"
                ? "peakViewers"
                : "concurrentViewers"
          }
        />
      )}
    </section>
  );
}
