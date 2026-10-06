"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getScoreRingColor } from "@/lib/colors";

type GameRankingEntry = {
  categoryId: string;
  category: string;
  posterImageUrl: string | null;
  avgViewers: number;
  broadcastCount: number;
  maxViewers: number;
  peakViewers: number;
  totalScore: number;
};

type SortKey =
  | "avgViewers"
  | "broadcastCount"
  | "maxViewers"
  | "peakViewers"
  | "totalScore";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "avgViewers", label: "평균 시청자" },
  { key: "totalScore", label: "인기 점수" },
  { key: "maxViewers", label: "최대 동시시청자" },
  { key: "peakViewers", label: "최고 시청자" },
  { key: "broadcastCount", label: "방송 수" },
];

export function GameRankingList({ games }: { games: GameRankingEntry[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("avgViewers");

  const sorted = useMemo(
    () => [...games].sort((a, b) => b[sortKey] - a[sortKey]),
    [games, sortKey],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortKey(opt.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              sortKey === opt.key
                ? "border-white/30 bg-white/10 text-white"
                : "border-white/10 text-white/40 hover:text-white/70"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {sorted.map((game, i) => (
          <Link
            key={game.categoryId}
            href={`/games/${encodeURIComponent(game.categoryId)}`}
            className="flex items-center gap-4 rounded-xl border border-white/10 px-4 py-2.5 transition-colors hover:bg-white/5"
          >
            <span className="w-5 shrink-0 text-sm text-white/40">{i + 1}</span>

            <div className="relative h-[52px] w-[39px] shrink-0 overflow-hidden rounded-lg bg-white/10">
              {game.posterImageUrl ? (
                <Image
                  src={game.posterImageUrl}
                  alt={game.category}
                  fill
                  className="object-cover"
                  sizes="39px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-white/30 sm:w-64">
                  {game.category[0]}
                </div>
              )}
            </div>

            <p className="min-w-0 flex-1 shrink-0 truncate text-sm font-medium text-white ">
              {game.category}
            </p>

            <div className="flex flex-1 items-center justify-end gap-4 sm:gap-18">
              <Stat
                label="평균 시청자"
                value={game.avgViewers}
                active={sortKey === "avgViewers"}
              />
              <Stat
                label="방송 수"
                value={game.broadcastCount}
                active={sortKey === "broadcastCount"}
              />
              <Stat
                label="최대 동시시청자"
                value={game.maxViewers}
                active={sortKey === "maxViewers"}
              />
              <Stat
                label="최고 시청자"
                value={game.peakViewers}
                active={sortKey === "peakViewers"}
              />
              <ScoreBadge
                score={game.totalScore}
                active={sortKey === "totalScore"}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  active,
}: {
  label: string;
  value: number;
  active: boolean;
}) {
  return (
    <div
      className={`w-20 shrink-0 text-right ${
        active ? "block" : "hidden sm:block"
      }`}
    >
      <p
        className={`text-[11px] ${active ? "text-white/60" : "text-white/30"}`}
      >
        {label}
      </p>
      <p
        className={`text-sm tabular-nums ${active ? "font-semibold text-white" : "text-white/70"}`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function ScoreBadge({ score, active }: { score: number; active: boolean }) {
  const color = getScoreRingColor(score);
  return (
    <div
      className={`h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold tracking-wide ${
        active ? "flex" : "hidden sm:flex"
      }`}
      style={{ borderColor: color, color }}
    >
      {score}
    </div>
  );
}
