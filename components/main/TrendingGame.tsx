"use client";

import { Suspense, use, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { Notice } from "../shared/Notice";

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
  maxViewers?: number;
  peakViewers?: number;
  totalViewers?: number;
  posterImageUrl: string | null;

  totalScore?: number;
  changeRate?: number;
};

type LiveData = {
  byLive: Game[];
  collectedAt: string;
};

type Props = {
  livePromise: Promise<LiveData>;
  byMax: Game[];
  byScore: Game[];
};

type ValueKey =
  | "concurrentViewers"
  | "maxViewers"
  | "totalScore"
  | "totalViewers";

const tabs = [
  { label: "실시간 시청자", key: "byLive" as const },
  { label: "최고 동시시청자", key: "byMax" as const },
  { label: "인기 점수", key: "byScore" as const },
];

function getGradientColors(score: number): [string, string] {
  if (score >= 70) return ["#f59e0b", "#1bb373"];
  if (score >= 40) return ["#e24b4a", "#f59e0b"];
  return ["#e24b4a", "#f97316"];
}

// score 숫자 텍스트에 그라데이션(색상)만 입히고 싶을 때 쓰는 style
function scoreTextGradientStyle(score: number): CSSProperties {
  const [start, end] = getGradientColors(score);
  return {
    backgroundImage: `linear-gradient(135deg, ${start}, ${end})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };
}

// 점수(byScore)에서 공통으로 쓰는 그라데이션 텍스트 + 테두리 박스
function ScoreBadge({
  score,
  className = "",
  textClassName = "",
}: {
  score: number;
  className?: string;
  textClassName?: string;
}) {
  const [start, end] = getGradientColors(score);
  return (
    <div className="inline-flex ">
      <div
        className={`inline-flex rounded-sm sm:rounded-lg bg-black/70 backdrop-blur-sm ${className}`}
      >
        <span
          className={`leading-none [font-family:var(--font-anton)] ${textClassName}`}
          style={scoreTextGradientStyle(score)}
        >
          {score}
        </span>
      </div>
    </div>
  );
}

function getTrendSegments(changeRate?: number) {
  const rate = changeRate ?? 0;
  const colors = ["#e24b4a", "#f59e0b", "#00ce7a"] as const;

  const justifyByIndex = [
    "justify-start",
    "justify-center",
    "justify-end",
  ] as const;

  if (rate <= -0.3)
    return {
      label: "하락세",
      activeIndex: 0,
      colors,
      justify: justifyByIndex[0],
    };
  if (rate >= 0.3)
    return {
      label: "상승세",
      activeIndex: 2,
      colors,
      justify: justifyByIndex[2],
    };
  return { label: "유지", activeIndex: 1, colors, justify: justifyByIndex[1] };
}

// GameScoreCard와 동일한 3구간 추세 표시 (급락/하락세/지속)
function TrendBar({
  changeRate,
  showLabel = true,
  className = "",
}: {
  changeRate?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const { label, activeIndex, colors, justify } = getTrendSegments(changeRate);
  return (
    <div className={className}>
      {showLabel && (
        <div className={`flex items-center mb-1 ${justify}`}>
          <span className="text-xs font-extrabold text-white/90">{label}</span>
        </div>
      )}
      <div className="flex gap-1">
        {colors.map((color, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full"
            style={{ background: color, opacity: i === activeIndex ? 1 : 0.25 }}
          />
        ))}
      </div>
    </div>
  );
}

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
  valueKey,
}: {
  game: Game;
  rank: number;
  valueKey: ValueKey;
}) {
  const router = useRouter();
  const isFirst = rank === 1;
  const isScore = valueKey === "totalScore";
  const borderColor =
    rank === 1 ? "#f59e0b" : rank === 2 ? "#9ca3af" : "#b45309";
  const badgeBg = rank === 1 ? "#fef3c7" : rank === 2 ? "#f3f4f6" : "#fef3c7";
  const badgeBorder =
    rank === 1 ? "#f59e0b" : rank === 2 ? "#9ca3af" : "#b45309";
  const badgeColor =
    rank === 1 ? "#92400e" : rank === 2 ? "#374151" : "#78350f";
  const imgWidth = isFirst ? "w-32 md:w-56 lg:w-72" : "w-24 md:w-48 lg:w-64";
  const value = (game[valueKey] ?? 0) as number;

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
          {isScore ? (
            <div className="absolute top-2 right-2 md:top-3 md:right-3">
              <ScoreBadge
                score={value}
                className="px-2 py-1 md:px-3 md:py-1.5"
                textClassName="text-4xl tracking-wider"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl md:text-5xl lg:text-6xl leading-none [font-family:var(--font-anton)] tracking-wider text-gray-200">
                {value.toLocaleString()}
              </span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
            <p className="text-xs md:text-sm font-bold text-white/90 truncate mb-1 md:mb-2">
              {game.category}
            </p>
            {isScore && (
              <TrendBar
                changeRate={game.changeRate}
                className="mb-1 md:mb-1.5"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GameRankingBody({
  games,
  valueKey,
}: {
  games: Game[];
  valueKey: ValueKey;
}) {
  const isScore = valueKey === "totalScore";
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
            {isScore && (
              <div className="absolute top-2.5 right-2.5">
                <ScoreBadge
                  score={top3[0].totalScore ?? 0}
                  className="px-2.5 py-1"
                  textClassName="text-3xl"
                />
              </div>
            )}
            <div className="absolute inset-0 flex items-center gap-4 px-4">
              <div className="min-w-0 flex-1">
                <p className="text-white/90 font-bold text-sm truncate">
                  {top3[0].category}
                </p>
                {isScore ? (
                  <TrendBar
                    changeRate={top3[0].changeRate}
                    className="mt-1.5 w-24"
                  />
                ) : (
                  <p
                    className="text-white text-4xl leading-none mt-0.5"
                    style={{ fontFamily: "var(--font-anton)" }}
                  >
                    {(top3[0][valueKey] as number)?.toLocaleString()}
                  </p>
                )}
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
                {isScore && (
                  <div className="absolute top-1.5 right-1.5">
                    <ScoreBadge
                      score={game.totalScore ?? 0}
                      className="px-1.5 py-0.5"
                      textClassName="text-xl"
                    />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white/90 font-bold text-xs truncate">
                    {game.category}
                  </p>
                  {isScore ? (
                    <TrendBar
                      changeRate={game.changeRate}
                      showLabel={false}
                      className="mt-1"
                    />
                  ) : (
                    <p
                      className="text-white text-2xl leading-tight"
                      style={{ fontFamily: "var(--font-anton)" }}
                    >
                      {(game[valueKey] ?? 0).toLocaleString()}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* 4~9위 — 2열 콤팩트 카드 */}
        <div className="grid grid-cols-2 gap-2">
          {rest.slice(0, 6).map((game) => (
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
              {isScore && (
                <div className="absolute top-1 right-1">
                  <ScoreBadge
                    score={game.totalScore ?? 0}
                    className="px-1.5 py-0.5"
                    textClassName="text-xl"
                  />
                </div>
              )}
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white/90 text-[10px] truncate font-semibold">
                  {game.category}
                </p>
                {isScore ? (
                  <TrendBar
                    changeRate={game.changeRate}
                    showLabel={false}
                    className="mt-1"
                  />
                ) : (
                  <p
                    className="text-white text-xl leading-tight"
                    style={{ fontFamily: "var(--font-anton)" }}
                  >
                    {(game[valueKey] ?? 0).toLocaleString()}
                  </p>
                )}
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
              {isScore ? (
                <div className="absolute top-2 right-2">
                  <ScoreBadge
                    score={game.totalScore ?? 0}
                    className="px-2 py-1"
                    textClassName="text-4xl"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-5xl lg:text-6xl text-gray-200 leading-none tracking-widest"
                    style={{ fontFamily: "var(--font-anton)" }}
                  >
                    {(game[valueKey] ?? 0).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-sm font-bold text-white/90 truncate mb-2">
                  {game.category}
                </p>
                {isScore && (
                  <TrendBar
                    changeRate={game.changeRate}
                    className="-mt-1 mb-2"
                  />
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
  const { byLive } = use(livePromise);
  return <GameRankingBody games={byLive} valueKey="totalViewers" />;
}

export function TrendingGame({ livePromise, byMax, byScore }: Props) {
  const [active, setActive] = useState<"byLive" | "byMax" | "byScore">("byMax");
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
          ) : active === "byScore" ? (
            <>
              <p className="text-xs md:text-sm text-white/40">
                최근 7일간 데이터 기준
              </p>
              <div className="relative group">
                <Info className="w-4 h-4 text-white/30 cursor-help -translate-y-px" />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 md:w-72 p-3 rounded-lg bg-white/10 backdrop-blur-sm text-xs text-white/70 hidden group-hover:block z-10 text-left space-y-1.5">
                  <p>
                    · 시청자 (60%) — 최근 7일 평균 동시시청자 기준, 1위 게임은
                    100점
                  </p>
                  <p>· 방송 수 (40%) — 최근 7일 총 방송 수 기준</p>
                  <p>
                    · 추세 감점 — 최근 3일 평균이 이전 4일 평균보다 크게
                    하락하면 감점돼요
                  </p>
                  <p>· 상위 2,000개 방송 기준으로 집계됩니다</p>
                </div>
              </div>
            </>
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
      <Notice className="mx-auto">
        2026년 8월 6일부터 집계하는 LCK, EWC 등 대회 중계 관련 같이보기 방송은
        게임 랭킹·스트리머 랭킹 집계에서 제외됩니다. <br />
        실제 게임을 플레이하는 스트리머의 시청자만 게임 랭킹과 통계에 반영되며,
        같이보기 시청자는 해당 스트리머의 개인 기록에만 남게됩니다.
      </Notice>
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
          games={active === "byMax" ? byMax : byScore}
          valueKey={active === "byMax" ? "maxViewers" : "totalScore"}
        />
      )}
    </section>
  );
}
