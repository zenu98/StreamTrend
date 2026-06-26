"use client";

import { useState } from "react";
import { ChartLineLabel } from "@/components/ui/charts/chart-line-label";
import { TimeSeriesData } from "@/types/chart";

type Props = {
  categoryId: string;
  weekly: TimeSeriesData[];
  monthly: TimeSeriesData[];
};

export function GameTrendChart({ categoryId, weekly, monthly }: Props) {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "custom">(
    "weekly",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customData, setCustomData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const current =
    period === "weekly" ? weekly : period === "monthly" ? monthly : customData;

  async function fetchCustom() {
    if (!startDate || !endDate) return;
    setLoading(true);
    const res = await fetch(
      `/api/game-stats?categoryId=${encodeURIComponent(categoryId)}&from=${startDate}&to=${endDate}`,
    );
    const data = await res.json();
    setCustomData(data);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["weekly", "monthly"] as const).map((p) => (
          <button
            key={p}
            onClick={() => {
              setPeriod(p);
              setShowCustom(false);
            }}
            className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
              period === p
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground"
            }`}
          >
            {p === "weekly" ? "7일" : "30일"}
          </button>
        ))}
        <button
          onClick={() => {
            setPeriod("custom");
            setShowCustom(true);
          }}
          className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
            period === "custom"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border text-muted-foreground"
          }`}
        >
          직접 선택
        </button>
      </div>

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
          <button
            onClick={fetchCustom}
            className="mt-4 px-4 py-1.5 rounded-md text-sm bg-primary text-primary-foreground"
          >
            조회
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartLineLabel
            title="시청자 수"
            description="평균 동시시청자"
            data={current}
            dataKey="concurrentViewers"
          />
          <ChartLineLabel
            title="방송 수"
            description="평균 방송 수"
            data={current}
            dataKey="broadcastCount"
          />
        </div>
      )}
    </div>
  );
}
