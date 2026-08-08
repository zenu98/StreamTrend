"use client";

import { useState } from "react";
import Image from "next/image";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns";
import { DayGamesDialog } from "../shared/DayGamesDialog";

type GameRow = {
  date: string;
  liveCategory: string;
  liveCategoryValue: string;
  avgViewers: number;
  posterImageUrl: string | null;
  broadcastCount: number;
};

type Props = {
  activeMonth: string;
  gameMap: Map<string, GameRow[]>;
  kstYesterdayStr: string;
};

export function GameGrid({ activeMonth, gameMap, kstYesterdayStr }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthDate = parseISO(`${activeMonth}-01`);
  const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // 모바일 가로 스크롤에서는 이번 달 실제 날짜만 (앞뒤 다른 달 채움 없이)
  const monthOnlyDays = days.filter((d) => isSameMonth(d, monthDate));

  function renderCell(day: Date, size: "grid" | "scroll") {
    const dateStr = format(day, "yyyy-MM-dd");
    const inMonth = isSameMonth(day, monthDate);
    const isFuture = dateStr > kstYesterdayStr;
    const games = gameMap.get(dateStr) ?? [];
    const top = games[0];
    const today = isToday(day);
    const clickable = !isFuture && games.length > 0;

    return (
      <button
        key={dateStr}
        disabled={!clickable}
        onClick={() => clickable && setSelectedDate(dateStr)}
        className={`relative aspect-[3/4] rounded-lg border overflow-hidden text-left ${
          size === "scroll" ? "w-20 flex-shrink-0" : ""
        } ${
          inMonth && !isFuture
            ? "border-white/10"
            : "border-transparent opacity-25"
        } ${today ? "ring-1 ring-white/30" : ""} ${
          clickable ? "hover:border-white/25 cursor-pointer" : ""
        }`}
      >
        {top?.posterImageUrl && !isFuture ? (
          <Image
            src={top.posterImageUrl}
            alt={top.liveCategoryValue}
            fill
            className="object-cover"
            sizes="120px"
          />
        ) : (
          <div className="absolute inset-0 bg-white/[0.02]" />
        )}

        {top && !isFuture && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        )}

        <span className="absolute top-1 left-1.5 text-xl text-white/70 font-extrabold">
          {format(day, "d")}
        </span>

        {games.length > 1 && (
          <span
            className="absolute top-1 right-1 text-xs bg-black/60 text-white/80 rounded-md px-1.5"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            +{games.length - 1}
          </span>
        )}

        {top && !isFuture && (
          <span className="absolute bottom-1 left-1 right-1 text-xs font-bold text-white truncate">
            {top.liveCategoryValue}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {/* 데스크톱: 7열 달력 그리드 */}
      <div className="hidden md:block space-y-1.5">
        <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-white/40">
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day) => renderCell(day, "grid"))}
        </div>
      </div>

      {/* 모바일: 가로 스크롤 카드 (방송 기록 탭과 동일한 패턴) */}
      <div className="md:hidden flex gap-1.5 overflow-x-auto pb-2">
        {monthOnlyDays.map((day) => renderCell(day, "scroll"))}
      </div>

      <DayGamesDialog
        date={selectedDate}
        games={selectedDate ? (gameMap.get(selectedDate) ?? []) : []}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  );
}
