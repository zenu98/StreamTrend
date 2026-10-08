"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getScoreRingColor } from "@/lib/colors";
import { Pin, Search, X } from "lucide-react";

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
  { key: "totalScore", label: "인기 점수" },
  { key: "avgViewers", label: "평균 시청자" },
  { key: "maxViewers", label: "최대 동시시청자" },
  { key: "peakViewers", label: "최고 시청자" },
  { key: "broadcastCount", label: "방송 수" },
];

export function GameRankingList({ games }: { games: GameRankingEntry[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("totalScore");
  const [query, setQuery] = useState("");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return games.filter((g) => g.category.toLowerCase().includes(q));
  }, [games, query]);

  const sorted = useMemo(
    () => [...games].sort((a, b) => b[sortKey] - a[sortKey]),
    [games, sortKey],
  );
  const pinnedGames = useMemo(
    () =>
      pinnedIds
        .map((id) => sorted.find((g) => g.categoryId === id))
        .filter((g): g is GameRankingEntry => g != null),
    [pinnedIds, sorted],
  );
  function togglePin(categoryId: string) {
    setPinnedIds(
      (prev) =>
        prev.includes(categoryId)
          ? prev.filter((id) => id !== categoryId) // 이미 고정됐으면 해제
          : [categoryId, ...prev], // 새 고정은 맨 앞(최상단)에 추가
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="게임 이름 검색"
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-9 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {pinnedGames.length > 0 && (
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="px-1 text-xs text-white/40">
            고정된 게임 {pinnedGames.length}개
          </p>
          <div className="flex flex-col gap-2">
            {pinnedGames.map((game) => (
              <GameRankingRow
                key={`pinned-${game.categoryId}`}
                game={game}
                rank={
                  sorted.findIndex((g) => g.categoryId === game.categoryId) + 1
                }
                sortKey={sortKey}
                isPinned
                onTogglePin={() => togglePin(game.categoryId)}
              />
            ))}
          </div>
        </div>
      )}

      {query && (
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="px-1 text-xs text-white/40">
            &ldquo;{query}&rdquo; 검색 결과 {searchResults.length}개
          </p>
          {searchResults.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">
              {`해당하는 게임이 ${games.length}위 안에 없어요. 더보기를 눌러 리스트를 더
              불러와보세요.`}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {searchResults.map((game) => (
                <GameRankingRow
                  key={`search-${game.categoryId}`}
                  game={game}
                  rank={
                    sorted.findIndex((g) => g.categoryId === game.categoryId) +
                    1
                  }
                  sortKey={sortKey}
                  isPinned={pinnedIds.includes(game.categoryId)}
                  onTogglePin={() => togglePin(game.categoryId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

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
          <GameRankingRow
            key={game.categoryId}
            game={game}
            rank={i + 1}
            sortKey={sortKey}
            isPinned={pinnedIds.includes(game.categoryId)}
            onTogglePin={() => togglePin(game.categoryId)}
          />
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
        className={`text-[11px] ${active ? "text-white/80" : "text-white/50"}`}
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

function GameRankingRow({
  game,
  rank,
  sortKey,
  isPinned,
  onTogglePin,
}: {
  game: GameRankingEntry;
  rank: number;
  sortKey: SortKey;
  isPinned: boolean;
  onTogglePin: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 overflow-hidden rounded-xl border border-white/10 pr-2 transition-colors hover:bg-white/5">
      <Link
        href={`/games/${encodeURIComponent(game.categoryId)}`}
        className="flex min-w-0 flex-1 items-center gap-4 px-4 py-2.5"
      >
        <span className="w-5 shrink-0 text-sm text-white/40">{rank}</span>

        <div className="relative aspect-3/4 w-10.5 shrink-0 overflow-hidden rounded-lg bg-white/10">
          {game.posterImageUrl ? (
            <Image
              src={game.posterImageUrl}
              alt={game.category}
              fill
              className="object-cover"
              sizes="42px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/30">
              {game.category[0]}
            </div>
          )}
        </div>

        <p className="min-w-0 max-w-[200px] flex-1 truncate text-sm font-medium text-white sm:max-w-[360px]">
          {game.category}
        </p>

        <div className="flex flex-1 min-w-0 items-center justify-end gap-[clamp(0.5rem,1.5vw,4.5rem)]">
          <Stat
            label="방송 수"
            value={game.broadcastCount}
            active={sortKey === "broadcastCount"}
          />
          <Stat
            label="평균 시청자"
            value={game.avgViewers}
            active={sortKey === "avgViewers"}
          />
          <Stat
            label="최고 시청자"
            value={game.peakViewers}
            active={sortKey === "peakViewers"}
          />

          <Stat
            label="최대 동시시청자"
            value={game.maxViewers}
            active={sortKey === "maxViewers"}
          />

          <ScoreBadge
            score={game.totalScore}
            active={sortKey === "totalScore"}
          />
        </div>
      </Link>
    </div>
  );
}
