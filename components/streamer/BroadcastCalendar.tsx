"use client";

import { toKSTDateFullString } from "@/lib/utils";
import { Info } from "lucide-react";
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
  const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
  const currentMonth = kstNow.toISOString().slice(0, 7); // "2026-08"

  const months = Array.from(
    new Set([
      ...trendRows.map((r) => r.date.slice(0, 7)),
      currentMonth, // 현재 월 항상 포함
    ]),
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

  kstNow.setUTCDate(kstNow.getUTCDate() - 1);
  const kstYesterday = kstNow.toISOString().slice(0, 10); // "2026-08-02"

  const days = getDaysInMonth(activeMonth).filter(
    (date) => date <= kstYesterday,
  );

  const broadcastCount = days.filter((d) => broadcastDates.has(d)).length;
  const offCount = days.length - broadcastCount;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg md:text-xl font-bold">방송 기록</h2>
        <div className="relative group">
          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
          <div className="absolute left-0 top-full mt-2 w-64 p-3 rounded-lg bg-white/10 backdrop-blur-sm text-xs text-white/70 hidden group-hover:block z-10 space-y-1">
            <p>· 매일 06:00 ~ 다음날 06:00을 하루로 집계해요</p>
            <p>· 예를 들어 28일 새벽 방송은 27일 기록으로 표시돼요</p>
            <p>· 2026년 7월 이전 데이터는 집계가 부정확할 수 있어요</p>
          </div>
        </div>
      </div>
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
