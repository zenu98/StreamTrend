"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { ChartLineLabel } from "@/components/ui/charts/chart-line-label";

type Row = {
  date: string;
  totalViewers: number;
  concurrentViewers: number;
  broadcastCount: number;
  maxViewers: number;
  peakViewers: number;
};

type Metric = "concurrentViewers" | "maxViewers" | "peakViewers";

type Props = {
  allRows: Row[];
  dateRange: DateRange | undefined;
  metric: Metric;
  liveStats?: { currentViewers: number; currentCount: number };
  topStreamersByDate?: Record<
    string,
    {
      channelId: string;
      channelName: string;
      channelImageUrl: string | null;
      maxViewers: number;
    }[]
  >;
};

const metricLabels: Record<Metric, string> = {
  concurrentViewers: "평균 시청자",
  maxViewers: "최고 동시시청자",
  peakViewers: "최고 시청자",
};

export function GameTrendChart({
  allRows = [],
  dateRange,
  metric,
  liveStats,
  topStreamersByDate,
}: Props) {
  const filtered = useMemo(() => {
    let rows = allRows;
    if (dateRange?.from && dateRange?.to) {
      const from = format(dateRange.from, "MM-dd");
      const to = format(dateRange.to, "MM-dd");
      rows = rows.filter((r) => r.date >= from && r.date <= to);
    }

    // 오늘 실시간 데이터 추가
    if (liveStats) {
      const today = format(new Date(), "MM-dd");
      const alreadyExists = rows.some((r) => r.date === today);
      if (!alreadyExists) {
        rows = [
          ...rows,
          {
            date: today,
            totalViewers: liveStats.currentViewers,
            concurrentViewers: liveStats.currentViewers,
            broadcastCount: liveStats.currentCount,
            maxViewers: liveStats.currentViewers,
            peakViewers: liveStats.currentViewers,
          },
        ];
      }
    }

    return rows;
  }, [allRows, dateRange, liveStats]);

  return (
    <div className="space-y-4">
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">데이터 없음</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartLineLabel
            title={metricLabels[metric]}
            description={`날짜별 ${metricLabels[metric]}`}
            data={filtered}
            dataKey={metric}
            topStreamersByDate={topStreamersByDate}
            hasLiveData={!!liveStats}
          />
          <ChartLineLabel
            title="방송 수"
            description="날짜별 평균 방송 수"
            data={filtered}
            dataKey="broadcastCount"
          />
        </div>
      )}
    </div>
  );
}
