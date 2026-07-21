"use client";

import { useState, useMemo } from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { ChartBarMixed } from "@/components/ui/charts/bar-chart-mixed";
import { StreamerGameDistribution } from "./StreamerGameDistribution";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { UnderlineTabs } from "@/components/shared/UnderlineTabs";

type Row = {
  date: string;
  liveCategory: string;
  liveCategoryValue: string;
  categoryType: string;
  totalViewers: number;
  broadcastCount: number;
  avgViewers: number;
  maxViewers: number;
};

type Props = {
  rows: Row[];
};

const presets = [
  { label: "어제", key: "yesterday" },
  { label: "7일", key: "weekly" },
  { label: "30일", key: "monthly" },
  { label: "전체", key: "all" },
] as const;

type PresetKey = (typeof presets)[number]["key"];
type Metric = "avgViewers" | "maxViewers";

const metricTabs = [
  { label: "평균 시청자", key: "avgViewers" as const },
  { label: "최고 시청자", key: "maxViewers" as const },
];

export function StreamerDateFilter({ rows }: Props) {
  const [active, setActive] = useState<PresetKey | "custom">("weekly");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [metric, setMetric] = useState<Metric>("avgViewers");

  const filtered = useMemo(() => {
    const today = new Date();
    const kstToday = new Date(today.getTime() + 9 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    if (active === "yesterday") {
      const yesterday = new Date(
        today.getTime() + 9 * 60 * 60 * 1000 - 86400000,
      )
        .toISOString()
        .slice(0, 10);
      return rows.filter((r) => r.date === yesterday);
    }
    if (active === "weekly") {
      const from = new Date(today.getTime() + 9 * 60 * 60 * 1000 - 7 * 86400000)
        .toISOString()
        .slice(0, 10);
      const yesterday = new Date(
        today.getTime() + 9 * 60 * 60 * 1000 - 86400000,
      )
        .toISOString()
        .slice(0, 10);
      return rows.filter((r) => r.date >= from && r.date <= yesterday); // kstToday → yesterday
    }
    if (active === "monthly") {
      const yesterday = new Date(
        today.getTime() + 9 * 60 * 60 * 1000 - 86400000,
      )
        .toISOString()
        .slice(0, 10);
      const from = new Date(
        today.getTime() + 9 * 60 * 60 * 1000 - 30 * 86400000,
      )
        .toISOString()
        .slice(0, 10);
      return rows.filter((r) => r.date >= from && r.date <= yesterday);
    }
    if (active === "all") {
      return rows;
    }
    if (active === "custom" && customRange?.from && customRange?.to) {
      const toYMD = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };
      const from = toYMD(customRange.from);
      const to = toYMD(customRange.to);
      return rows.filter((r) => r.date >= from && r.date <= to);
    }
    return rows;
  }, [active, rows, customRange]);

  const gameMap = useMemo(() => {
    const map = new Map<
      string,
      {
        liveCategoryValue: string;
        liveCategory: string;
        totalViewers: number;
        broadcastCount: number;
        maxViewers: number;
      }
    >();
    for (const row of filtered) {
      const prev = map.get(row.liveCategory) ?? {
        liveCategoryValue: row.liveCategoryValue,
        liveCategory: row.liveCategory,
        totalViewers: 0,
        broadcastCount: 0,
        maxViewers: 0,
      };
      map.set(row.liveCategory, {
        ...prev,
        totalViewers: prev.totalViewers + row.totalViewers,
        broadcastCount: prev.broadcastCount + row.broadcastCount,
        maxViewers: Math.max(prev.maxViewers, row.maxViewers),
      });
    }
    return Array.from(map.values())
      .map((d) => ({
        category: d.liveCategoryValue,
        categoryId: d.liveCategory,
        totalViewers: d.totalViewers,
        count: d.broadcastCount,
        avgViewers:
          d.broadcastCount > 0
            ? Math.round(d.totalViewers / d.broadcastCount)
            : 0,
        concurrentViewers:
          d.broadcastCount > 0
            ? Math.round(d.totalViewers / d.broadcastCount)
            : 0,
        maxViewers: d.maxViewers,
      }))
      .sort((a, b) =>
        metric === "maxViewers"
          ? b.maxViewers - a.maxViewers
          : b.avgViewers - a.avgViewers,
      );
  }, [filtered, metric]);

  const setPreset = (key: PresetKey) => {
    setActive(key);

    const today = new Date();

    if (key === "yesterday") {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      setCustomRange({ from: d, to: d });
      return;
    }
    if (key === "weekly") {
      const to = new Date(today);
      to.setDate(to.getDate() - 1); // 어제까지
      const from = new Date(today);
      from.setDate(from.getDate() - 7);
      setCustomRange({ from, to }); // to가 today → yesterday
      return;
    }
    if (key === "monthly") {
      const to = new Date(today);
      to.setDate(to.getDate() - 1);
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      setCustomRange({ from, to });
      return;
    }
    if (key === "all") {
      setCustomRange(undefined);
      return;
    }
  };

  const getBadgeLabel = () => {
    if (active === "yesterday") return "어제";
    if (active === "weekly") return "최근 7일";
    if (active === "monthly") return "최근 30일";
    if (active === "all") return "전체 기간";
    if (active === "custom" && customRange?.from && customRange?.to) {
      return `${format(customRange.from, "MM.dd")} ~ ${format(customRange.to, "MM.dd")}`;
    }
    return "기간 선택";
  };

  const chartTitle = metric === "maxViewers" ? "최고 시청자" : "평균 시청자";
  const chartDescription =
    metric === "maxViewers" ? "게임별 최고 시청자" : "게임별 평균 시청자 수";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <UnderlineTabs
          options={metricTabs}
          active={metric}
          onChange={setMetric}
        />

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-white/3 p-1.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-sm font-semibold text-white">
            <CalendarDays className="h-4 w-4 shrink-0 text-white/40" />
            {getBadgeLabel()}
          </div>

          <div className="h-5 w-px bg-white/10" />

          <div className="flex items-center gap-0.5">
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => setPreset(p.key)}
                className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                style={
                  active === p.key
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
                    active === p.key ? "" : "text-white/40 hover:text-white/70"
                  }
                >
                  {p.label}
                </span>
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-white/10" />

          <DateRangePicker
            value={customRange}
            onChange={(range) => {
              setCustomRange(range);
              setActive("custom");
            }}
          />
        </div>
      </div>

      {gameMap.length === 0 ? (
        <p className="text-sm text-muted-foreground">데이터 없음</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartBarMixed
            title={chartTitle}
            description={chartDescription}
            data={gameMap}
            dataKey={metric}
          />
          <StreamerGameDistribution
            rows={gameMap}
            title="방송 비중"
            description="게임별 방송 비중"
          />
        </div>
      )}
    </div>
  );
}
