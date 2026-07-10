"use client";

import { useState, useMemo } from "react";
import { ChartBarMixed } from "@/components/ui/charts/bar-chart-mixed";
import { CategoryPieChart } from "@/components/ui/charts/chart-pie-legend";

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

export function StreamerDateFilter({ rows }: Props) {
  const [active, setActive] = useState<PresetKey | "custom">("weekly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showCustom, setShowCustom] = useState(false);

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
      return rows.filter((r) => r.date >= from && r.date <= kstToday);
    }
    if (active === "monthly") {
      const from = new Date(
        today.getTime() + 9 * 60 * 60 * 1000 - 30 * 86400000,
      )
        .toISOString()
        .slice(0, 10);
      return rows.filter((r) => r.date >= from && r.date <= kstToday);
    }
    if (active === "all") {
      return rows;
    }
    if (active === "custom" && startDate && endDate) {
      return rows.filter((r) => r.date >= startDate && r.date <= endDate);
    }
    return rows;
  }, [active, rows, startDate, endDate]);

  // 게임별 합산
  const gameMap = useMemo(() => {
    const map = new Map<
      string,
      {
        liveCategoryValue: string;
        liveCategory: string;
        totalViewers: number;
        broadcastCount: number;
      }
    >();
    for (const row of filtered) {
      const prev = map.get(row.liveCategory) ?? {
        liveCategoryValue: row.liveCategoryValue,
        liveCategory: row.liveCategory,
        totalViewers: 0,
        broadcastCount: 0,
      };
      map.set(row.liveCategory, {
        ...prev,
        totalViewers: prev.totalViewers + row.totalViewers,
        broadcastCount: prev.broadcastCount + row.broadcastCount,
      });
    }
    return Array.from(map.values())
      .map((d) => ({
        category: d.liveCategoryValue,
        categoryId: d.liveCategory,
        totalViewers: d.totalViewers,
        count: d.broadcastCount,
        avgViewers: Math.round(d.totalViewers / d.broadcastCount),
        concurrentViewers: Math.round(d.totalViewers / d.broadcastCount),
        maxViewers: 0,
        peakViewers: 0,
      }))
      .sort((a, b) => b.totalViewers - a.totalViewers);
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* 탭 */}
      <div className="flex gap-2 flex-wrap">
        {presets.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActive(tab.key);
              setShowCustom(false);
            }}
            className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
              active === tab.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => {
            setActive("custom");
            setShowCustom((prev) => !prev);
          }}
          className={`px-4 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1 ${
            active === "custom"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border text-muted-foreground"
          }`}
        >
          직접 선택
        </button>
      </div>

      {/* 직접 선택 */}
      {showCustom && (
        <div className="flex gap-3 items-center flex-wrap p-3 rounded-lg border bg-muted/50">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">시작일</p>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm bg-background"
            />
          </div>
          <span className="text-muted-foreground mt-4">~</span>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">종료일</p>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm bg-background"
            />
          </div>
        </div>
      )}

      {/* 차트 */}
      {gameMap.length === 0 ? (
        <p className="text-sm text-muted-foreground">데이터 없음</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartBarMixed
            title="시청자 수"
            description="게임별 시청자 수"
            data={gameMap}
            dataKey="avgViewers"
          />
          <CategoryPieChart
            title="방송 비중"
            description="게임별 방송 비중"
            data={gameMap}
            dataKey="count"
          />
        </div>
      )}
    </div>
  );
}
