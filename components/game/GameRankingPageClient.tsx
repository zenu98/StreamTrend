"use client";

import { useState, useTransition } from "react";
import { MonthWeekFilterTab } from "../ui/month-week-tab";
import { GameRankingList } from "./GameRankingList";

type GameRankingEntry = Parameters<typeof GameRankingList>[0]["games"][number];
type MonthGroup = { label: string; weeks: { label: string }[] };

export function GameRankingPageClient({
  groups,
  initialMonthIndex,
  initialWeekIndex,
  initialGames,
}: {
  groups: { label: string; weeks: { label: string }[] }[];
  initialMonthIndex: number;
  initialWeekIndex: number;
  initialGames: GameRankingEntry[];
}) {
  const [monthIndex, setMonthIndex] = useState(initialMonthIndex);
  const [weekIndex, setWeekIndex] = useState(initialWeekIndex);
  const [limit, setLimit] = useState(100);
  const [games, setGames] = useState(initialGames);
  const [isPending, startTransition] = useTransition();

  function fetchGames(m: number, w: number, lim: number) {
    startTransition(async () => {
      const res = await fetch(
        `/api/game-ranking?month=${m}&week=${w}&limit=${lim}`,
      );
      if (!res.ok) return;
      const json = await res.json();
      setGames(json.games);
    });
  }

  function handleWeekChange(m: number, w: number) {
    setMonthIndex(m);
    setWeekIndex(w);
    setLimit(100); // 기간 바뀌면 100개로 리셋
    fetchGames(m, w, 100);
  }

  function handleShowMore() {
    setLimit(200);
    fetchGames(monthIndex, weekIndex, 200);
  }

  return (
    <div className="space-y-4">
      <MonthWeekFilterTab
        groups={groups}
        monthIndex={monthIndex}
        weekIndex={weekIndex}
        onChange={handleWeekChange}
      />

      {isPending ? (
        <p className="py-12 text-center text-sm text-white/40">
          불러오는 중...
        </p>
      ) : (
        <>
          <GameRankingList games={games} />

          {limit === 100 && games.length >= 100 && (
            <button
              onClick={handleShowMore}
              className="w-full rounded-xl border border-white/10 py-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              더보기
            </button>
          )}
        </>
      )}
    </div>
  );
}
