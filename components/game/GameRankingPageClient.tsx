"use client";

import { useRef, useState, useTransition } from "react";
import { MonthWeekFilterTab } from "../ui/month-week-tab";
import { GameRankingList, type PinnedGame } from "./GameRankingList";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
type GameRankingEntry = Parameters<typeof GameRankingList>[0]["games"][number];

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
  // 한 번 받은 주차 결과를 기억 (key: "월-주-개수")
  const cacheRef = useRef(
    new Map<string, GameRankingEntry[]>([
      [`${initialMonthIndex}-${initialWeekIndex}-100`, initialGames],
    ]),
  );
  // 가장 마지막에 요청한 key. 늦게 도착한 이전 응답이 화면을 덮지 않게 함
  const latestKeyRef = useRef("");
  // 주차를 바꿔도 유지되도록 부모에서 관리
  const [pinned, setPinned] = useState<PinnedGame[]>([]);
  const [onlyPinned, setOnlyPinned] = useState(false);

  function togglePin(game: PinnedGame) {
    setPinned((prev) => {
      const next = prev.some((p) => p.categoryId === game.categoryId)
        ? prev.filter((p) => p.categoryId !== game.categoryId)
        : [game, ...prev];
      if (next.length === 0) setOnlyPinned(false);
      return next;
    });
  }

  function fetchGames(m: number, w: number, lim: number) {
    const key = `${m}-${w}-${lim}`;
    latestKeyRef.current = key;

    // 이미 받은 주차면 요청 없이 바로 표시
    const cached = cacheRef.current.get(key);
    if (cached) {
      setGames(cached);
      return;
    }

    startTransition(async () => {
      const res = await fetch(
        `/api/game-ranking?month=${m}&week=${w}&limit=${lim}`,
      );
      if (!res.ok) return;
      const json = await res.json();
      cacheRef.current.set(key, json.games);

      // 그사이 다른 주차를 눌렀으면 이 응답은 화면에 반영하지 않음 (캐시에만 저장)
      if (latestKeyRef.current === key) setGames(json.games);
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

      {/* 로딩 중에도 목록을 유지해서 고정/검색/정렬 상태가 날아가지 않게 함 */}
      <div className="relative">
        {/* 로딩 중에도 목록을 유지해서 고정/검색/정렬 상태가 날아가지 않게 함 */}
        <div
          className={`transition-opacity ${isPending ? "pointer-events-none opacity-30" : ""}`}
          aria-busy={isPending}
        >
          <GameRankingList
            games={games}
            pinned={pinned}
            onTogglePin={togglePin}
            onlyPinned={onlyPinned}
            onOnlyPinnedChange={setOnlyPinned}
          />

          {!onlyPinned && limit === 100 && games.length >= 100 && (
            <button
              onClick={handleShowMore}
              className="mt-4 w-full rounded-xl border border-white/10 py-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              더보기
            </button>
          )}
        </div>

        {/* 스크롤 위치와 관계없이 보이도록 화면 위쪽에 붙는 스피너 */}
        {isPending && (
          <div className="pointer-events-none absolute inset-0 z-10">
            <div className="sticky top-1/3 flex justify-center pt-16">
              <LoadingSpinner size={36} label="불러오는 중..." />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
