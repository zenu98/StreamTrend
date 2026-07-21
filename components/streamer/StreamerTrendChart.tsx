"use client";

import { useState, useMemo, useEffect } from "react";
import type { DateRange } from "react-day-picker";
import { differenceInCalendarDays } from "date-fns";
import { CalendarDays, Users, Clock } from "lucide-react";
import { ChartLineDefault } from "../ui/charts/chart-line-default";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { UnderlineTabs } from "@/components/shared/UnderlineTabs";
import { formatDuration, formatKoreanDate } from "@/lib/utils";

type GameBreakdown = {
  category: string;
  concurrentViewers: number;
  maxViewers: number;
  broadcastCount: number;
  liveTitle: string;
};

type TrendRow = {
  date: string;
  displayDate: string;
  concurrentViewers: number;
  maxViewers: number;
  gameBreakdown?: GameBreakdown[];
};

type Props = {
  trendRows: TrendRow[];
};

type Metric = "concurrentViewers" | "maxViewers";

const metricTabs = [
  { label: "평균 시청자", key: "concurrentViewers" as const },
  { label: "최고 시청자", key: "maxViewers" as const },
];

const presets = [
  { label: "7일", days: 7 },
  { label: "30일", days: 30 },
];

function StreamerTrendTooltip(props: any) {
  const { active, payload, metric, onActiveRow } = props;
  useEffect(() => {
    if (active && payload?.length) {
      onActiveRow?.(payload[0]?.payload as TrendRow);
    }
  }, [active, payload, onActiveRow]);
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as TrendRow | undefined;
  if (!row) return null;

  const headerLabel = metric === "maxViewers" ? "최고 시청자" : "평균 시청자";
  const headerValue =
    metric === "maxViewers" ? row.maxViewers : row.concurrentViewers;
  const gameValueLabel = metric === "maxViewers" ? "최고" : "평균";

  const content = (
    <>
      <div className="mb-2.5 flex items-center gap-2 border-b pb-2 font-semibold">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: "var(--chart-1)" }}
        />
        {headerLabel}
        <span className="ml-auto">{headerValue.toLocaleString()} 명</span>
      </div>

      {row.gameBreakdown && row.gameBreakdown.length > 0 && (
        <div className="space-y-2.5">
          {row.gameBreakdown.map((g) => {
            const gameValue =
              metric === "maxViewers" ? g.maxViewers : g.concurrentViewers;
            return (
              <div key={g.category}>
                <p className="text-xs font-medium text-foreground">
                  {g.category}
                </p>
                <p className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {gameValueLabel} {gameValue.toLocaleString()}명
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(g.broadcastCount)}
                  </span>
                </p>
                {g.liveTitle && (
                  <p className="mt-0.5 truncate text-xs italic text-muted-foreground/60">
                    {g.liveTitle}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="flex justify-end">
        <span className="text-xs text-muted-foreground/90">
          {formatKoreanDate(row.displayDate)}
        </span>
      </div>
    </>
  );

  return (
    <>
      {/* 데스크톱: 기존 떠다니는 툴팁 */}
      <div className="hidden md:block max-w-[280px] min-w-[220px] rounded-lg border bg-popover px-3.5 py-3 text-sm shadow-md">
        {content}
      </div>

      {/* 모바일: 투명 div (툴팁 자체는 안 보이게) */}
      <div className="md:hidden" />
    </>
  );
}

export function StreamerTrendChart({ trendRows }: Props) {
  const [activeRow, setActiveRow] = useState<TrendRow | null>(null);
  const [metric, setMetric] = useState<Metric>("concurrentViewers");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const to = new Date();
    to.setDate(to.getDate() - 1); // 어제까지
    const from = new Date();
    from.setDate(from.getDate() - 7); // 7일 전부터
    return { from, to };
  });

  const dayCount =
    dateRange?.from && dateRange?.to
      ? differenceInCalendarDays(dateRange.to, dateRange.from) + 1
      : null;

  const applyPreset = (days: number) => {
    const to = new Date();
    to.setDate(to.getDate() - 1); // 어제까지
    const from = new Date();
    from.setDate(from.getDate() - days); // days일 전부터
    setDateRange({ from, to });
  };

  const filteredRows = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return trendRows;

    const toYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    const from = toYMD(dateRange.from);
    const to = toYMD(dateRange.to);

    return trendRows.filter((r) => r.date >= from && r.date <= to);
  }, [trendRows, dateRange]);

  const metricLabel = metric === "maxViewers" ? "최고 시청자" : "평균 시청자";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <UnderlineTabs
          options={metricTabs}
          active={metric}
          onChange={setMetric}
        />

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-sm font-semibold text-white">
            <CalendarDays className="h-4 w-4 shrink-0 text-white/40" />
            {dayCount ? `최근 ${dayCount}일` : "기간 선택"}
          </div>

          <div className="h-5 w-px bg-white/10" />

          <div className="flex items-center gap-0.5">
            {presets.map((p) => (
              <button
                key={p.days}
                onClick={() => applyPreset(p.days)}
                className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                style={
                  dayCount === p.days
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
                    dayCount === p.days
                      ? ""
                      : "text-white/40 hover:text-white/70"
                  }
                >
                  {p.label}
                </span>
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-white/10" />

          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      <ChartLineDefault
        title="시청자 추이"
        description={`${filteredRows[0]?.displayDate ?? ""} ~ ${filteredRows[filteredRows.length - 1]?.displayDate ?? ""}`}
        data={filteredRows}
        dataKey={metric}
        xAxisKey="displayDate"
        label={metricLabel}
        footerNote={`전체 게임 통합 · 최근 ${filteredRows.length}일 기준`}
        renderTooltip={
          <StreamerTrendTooltip
            metric={metric}
            onActiveRow={setActiveRow} // ← 추가
          />
        }
      />

      {/* 모바일 전용 하단 고정 패널 */}
      {activeRow && (
        <div className="md:hidden rounded-lg border bg-popover px-3.5 py-3 text-sm">
          <div className="mb-2.5 flex items-center gap-2 border-b pb-2 font-semibold">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: "var(--chart-1)" }}
            />
            {metric === "maxViewers" ? "최고 시청자" : "평균 시청자"}
            <span className="ml-auto">
              {(metric === "maxViewers"
                ? activeRow.maxViewers
                : activeRow.concurrentViewers
              ).toLocaleString()}
            </span>
          </div>

          {activeRow.gameBreakdown && activeRow.gameBreakdown.length > 0 && (
            <div className="space-y-2.5">
              {activeRow.gameBreakdown.map((g) => {
                const gameValue =
                  metric === "maxViewers" ? g.maxViewers : g.concurrentViewers;
                return (
                  <div key={g.category}>
                    <p className="text-xs font-medium text-foreground">
                      {g.category}
                    </p>
                    <p className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {metric === "maxViewers" ? "최고" : "평균"}{" "}
                        {gameValue.toLocaleString()}명
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(g.broadcastCount)}
                      </span>
                    </p>
                    {g.liveTitle && (
                      <p className="mt-0.5 truncate text-xs italic text-muted-foreground/60">
                        {g.liveTitle}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end mt-2">
            <span className="text-xs text-muted-foreground/90">
              {formatKoreanDate(activeRow.displayDate)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
