"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
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
  categoryId: string;
  posterImageUrl: string | null;
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
      <div className="mb-2.5 flex items-center gap-2 border-b pb-2">
        <span
          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
          style={{ background: "var(--chart-1)" }}
        />
        <span className="text-sm font-semibold">{headerLabel}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {formatKoreanDate(row.displayDate)}
        </span>
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
      <div className="flex justify-end mt-4">
        <span className=" font-bold">{headerValue.toLocaleString()} 명</span>
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
  const [selectedGame, setSelectedGame] = useState<string>(""); // categoryId, "" = 전체
  const [gamePickerOpen, setGamePickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const to = new Date();
    to.setDate(to.getDate() - 1);
    const from = new Date();
    from.setDate(from.getDate() - 7);
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
  const gameOptions = useMemo(() => {
    const map = new Map<
      string,
      { categoryId: string; category: string; posterImageUrl: string | null }
    >();
    for (const row of filteredRows) {
      for (const g of row.gameBreakdown ?? []) {
        if (!map.has(g.categoryId)) {
          map.set(g.categoryId, {
            categoryId: g.categoryId,
            category: g.category,
            posterImageUrl: g.posterImageUrl,
          });
        }
      }
    }
    return Array.from(map.values());
  }, [filteredRows]);
  const selectedGameInfo = gameOptions.find(
    (g) => g.categoryId === selectedGame,
  );

  const chartRows = useMemo(() => {
    if (!selectedGame) return filteredRows;
    return filteredRows
      .filter((row) =>
        row.gameBreakdown?.some((gb) => gb.categoryId === selectedGame),
      )
      .map((row) => {
        const g = row.gameBreakdown!.find(
          (gb) => gb.categoryId === selectedGame,
        )!;
        return {
          ...row,
          concurrentViewers: g.concurrentViewers,
          maxViewers: g.maxViewers,
        };
      });
  }, [filteredRows, selectedGame]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <UnderlineTabs
            options={metricTabs}
            active={metric}
            onChange={setMetric}
          />

          <Dialog open={gamePickerOpen} onOpenChange={setGamePickerOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs md:text-sm text-white/70 hover:border-white/20">
                {selectedGameInfo ? (
                  <>{selectedGameInfo.category}</>
                ) : (
                  "전체 게임"
                )}
                <ChevronDown className="w-3 h-3 text-white/40" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm sm:max-w-lg lg:max-w-xl xl:max-w-3xl">
              <DialogHeader>
                <DialogTitle>카테고리 선택</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[70vh] overflow-y-auto pt-2 scrollbar-none [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => {
                    setSelectedGame("");
                    setGamePickerOpen(false);
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors ${
                    !selectedGame ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="w-full aspect-3/4 rounded-lg bg-white/10 flex items-center justify-center text-lg font-bold text-white/60">
                    전체
                  </div>
                  <span className="text-sm text-white/70 truncate w-full text-center">
                    전체 게임
                  </span>
                </button>
                {gameOptions.map((g) => (
                  <button
                    key={g.categoryId}
                    onClick={() => {
                      setSelectedGame(g.categoryId);
                      setGamePickerOpen(false);
                    }}
                    className={`flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors ${
                      selectedGame === g.categoryId
                        ? "bg-white/10"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="w-full aspect-3/4 rounded-lg overflow-hidden bg-white/10">
                      {g.posterImageUrl ? (
                        <Image
                          src={g.posterImageUrl}
                          alt={g.category}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-white/60">
                          {g.category[0]}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-white/70 truncate w-full text-center">
                      {g.category}
                    </span>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 기간 선택 박스 — 뱃지 + 프리셋 + 구분선 + DateRangePicker 다시 감쌈 */}
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
        title={
          selectedGameInfo
            ? `${selectedGameInfo.category} 시청자 추이`
            : "시청자 추이"
        }
        description={`${filteredRows[0]?.displayDate ?? ""} ~ ${filteredRows[filteredRows.length - 1]?.displayDate ?? ""}`}
        data={chartRows}
        dataKey={metric}
        xAxisKey="displayDate"
        label={metricLabel}
        footerNote={
          selectedGameInfo
            ? `${selectedGameInfo.category} · 최근 ${chartRows.length}일 기준`
            : `전체 게임 통합 · 최근 ${filteredRows.length}일 기준`
        }
        renderTooltip={
          <StreamerTrendTooltip metric={metric} onActiveRow={setActiveRow} />
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
              ).toLocaleString()}{" "}
              명
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
