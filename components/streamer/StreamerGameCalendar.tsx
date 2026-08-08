"use client";

import { useMemo, useState } from "react";
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
import { ko } from "date-fns/locale";

type Row = {
  date: string; // "YYYY-MM-DD"
  liveCategory: string;
  liveCategoryValue: string;
  avgViewers: number;
  maxViewers: number;
  broadcastCount: number;
  posterImageUrl: string | null;
};

export function StreamerGameCalendar({ rows }: { rows: Row[] }) {
  const months = useMemo(() => {
    const set = new Set(rows.map((r) => r.date.slice(0, 7)));
    return Array.from(set).sort();
  }, [rows]);

  const [activeMonth, setActiveMonth] = useState(
    months[months.length - 1] ?? format(new Date(), "yyyy-MM"),
  );

  const dayMap = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const list = map.get(r.date) ?? [];
      list.push(r);
      map.set(r.date, list);
    }
    return map;
  }, [rows]);

  if (rows.length === 0) {
    return <p className="text-sm text-white/40">데이터 없음</p>;
  }

  const monthDate = parseISO(`${activeMonth}-01`);
  const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {months.map((m) => (
          <button
            key={m}
            onClick={() => setActiveMonth(m)}
            className={`px-3 py-1.5 rounded-full text-xs md:text-sm border transition-colors ${
              activeMonth === m
                ? "bg-white/10 text-white border-white/30"
                : "bg-transparent border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
            }`}
          >
            {format(parseISO(`${m}-01`), "yyyy년 M월", { locale: ko })}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] md:text-xs text-white/40">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, monthDate);
          const games = (dayMap.get(dateStr) ?? []).sort(
            (a, b) => b.avgViewers - a.avgViewers,
          );
          const today = isToday(day);

          return (
            <div
              key={dateStr}
              className={`aspect-square rounded-lg border p-1 flex flex-col ${
                inMonth
                  ? "border-white/10 bg-white/[0.02]"
                  : "border-transparent opacity-25"
              } ${today ? "ring-1 ring-white/30" : ""}`}
            >
              <span className="text-[10px] text-white/40 mb-0.5 flex-shrink-0">
                {format(day, "d")}
              </span>
              {games.length > 0 && (
                <div className="flex flex-wrap gap-0.5 flex-1 content-start min-h-0">
                  {games.slice(0, 4).map((g) => (
                    <div
                      key={g.liveCategory}
                      title={`${g.liveCategoryValue} · 평균 ${g.avgViewers.toLocaleString()}명`}
                      className="w-1/2 md:w-4 md:h-5 aspect-3/4 rounded overflow-hidden bg-white/10 flex-shrink-0"
                    >
                      {g.posterImageUrl ? (
                        <Image
                          src={g.posterImageUrl}
                          alt={g.liveCategoryValue}
                          width={40}
                          height={53}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-white/60">
                          {g.liveCategoryValue[0]}
                        </div>
                      )}
                    </div>
                  ))}
                  {games.length > 4 && (
                    <span className="text-[8px] text-white/40 self-center">
                      +{games.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
