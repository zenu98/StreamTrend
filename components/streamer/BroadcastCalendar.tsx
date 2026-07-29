"use client";

import { useState } from "react";

type TrendRow = {
  date: string;
  concurrentViewers: number;
  broadcastCount?: number;
};

type Props = {
  trendRows: TrendRow[];
};

export function BroadcastCalendar({ trendRows }: Props) {
  const broadcastDates = new Set(trendRows.map((r) => r.date));

  const months = Array.from(
    new Set(trendRows.map((r) => r.date.slice(0, 7))),
  ).sort();

  const [activeMonth, setActiveMonth] = useState(
    months[months.length - 1] ?? "",
  );

  function getDaysInMonth(yearMonth: string) {
    const [year, month] = yearMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = String(i + 1).padStart(2, "0");
      return `${yearMonth}-${d}`;
    });
  }

  const days = getDaysInMonth(activeMonth);
  const broadcastCount = days.filter((d) => broadcastDates.has(d)).length;
  const offCount = days.length - broadcastCount;

  return (
    <div className="space-y-3">
      <h2 className="text-lg md:text-xl font-bold">방송 기록</h2>

      {/* 월별 탭 */}
      <div className="flex gap-2 flex-wrap mb-8">
        {months.map((m) => (
          <button
            key={m}
            onClick={() => setActiveMonth(m)}
            className="rounded-md px-3 py-0.5 text-sm font-semibold transition-colors border border-white/10"
            style={
              activeMonth === m
                ? {
                    background:
                      "color-mix(in oklch, var(--chart-1), transparent 85%)",
                    color: "var(--chart-1)",
                  }
                : undefined
            }
          >
            <span
              className={
                activeMonth === m ? "" : "text-white/40 hover:text-white/70"
              }
            >
              {m.slice(0, 4)}년 {String(Number(m.slice(5, 7)))}월
            </span>
          </button>
        ))}
      </div>

      {/* 바 타임라인 */}
      <div className="relative">
        <div className="flex gap-1 items-end overflow-x-auto pb-6">
          {days.map((date) => {
            const isBroadcast = broadcastDates.has(date);
            const day = Number(date.slice(8));
            return (
              <div
                key={date}
                className="flex flex-col items-center gap-1 flex-shrink-0"
              >
                <div
                  className="w-5 rounded-sm h-8 transition-colors"
                  style={{
                    background: "var(--chart-2)",
                    opacity: isBroadcast ? 1 : 0.15,
                  }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {day === 1 || day % 5 === 0 ? day : ""}
                </span>
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-0 right-0">
          <span className="text-sm">
            <span style={{ color: "var(--chart-2)" }} className="font-bold">
              방송 {broadcastCount}일
            </span>
            {" · "}
            <span className="font-bold text-white/30">휴방 {offCount}일</span>
          </span>
        </div>
      </div>

      {/* 레전드 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: "var(--chart-2)" }}
          />
          <span className="text-sm text-muted-foreground">방송</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm opacity-15"
            style={{ background: "var(--chart-2)" }}
          />
          <span className="text-sm text-muted-foreground">휴방</span>
        </div>
      </div>
    </div>
  );
}
