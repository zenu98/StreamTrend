"use client";

import { ChartBarMixed } from "@/components/ui/charts/bar-chart-mixed";
import { RankingCards } from "@/components/ui/charts/ranking-card-chart";
import { StatsCategoryData, BaseCategoryData } from "@/types/chart";
import { useState } from "react";

type LiveData = {
  collectedAt: string;
  byViewers: BaseCategoryData[];
  byCount: BaseCategoryData[];
};

type PeriodData = {
  byConcurrentViewers: StatsCategoryData[];
  byCount: StatsCategoryData[];
  byMaxViewers: (StatsCategoryData & { posterImageUrl?: string | null })[];
  byPeakViewers: (StatsCategoryData & { posterImageUrl?: string | null })[];
};

type Props = {
  daily: PeriodData;
  weekly: PeriodData;
  monthly: PeriodData;
  lives: LiveData;
};

const tabs = [
  { label: "실시간", key: "live" },
  { label: "어제", key: "daily" },
  { label: "최근 7일", key: "weekly" },
  { label: "최근 30일", key: "monthly" },
] as const;

export function StatsSection({ daily, weekly, monthly, lives }: Props) {
  const [active, setActive] = useState<"live" | "daily" | "weekly" | "monthly">(
    "live",
  );

  return (
    <div className="space-y-8">
      <h1
        className="text-8xl font-bold text-center my-8"
        style={{ color: "#c084fc" }}
      >
        {active === "live"
          ? "Live"
          : active === "daily"
            ? "Day"
            : active === "weekly"
              ? "7 Days"
              : "30 Days"}
      </h1>
      <div className="flex gap-2 justify-center">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
              active === tab.key
                ? "border-transparent text-white"
                : "bg-background border-border text-muted-foreground"
            }`}
            style={active === tab.key ? { backgroundColor: "#c084fc" } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === "live" ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {new Date(lives.collectedAt).toLocaleString("ko-KR", {
              timeZone: "Asia/Seoul",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            기준
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartBarMixed
              title="시청자 수"
              description="현재 카테고리별 시청자 수"
              data={lives.byViewers}
              dataKey="totalViewers"
              valueLabel="시청자: "
            />
            <ChartBarMixed
              title="방송 수"
              description="현재 카테고리별 방송 수"
              data={lives.byCount}
              dataKey="count"
              valueLabel="방송:"
            />
          </div>
        </div>
      ) : (
        (() => {
          const data = { daily, weekly, monthly }[active];
          return data.byConcurrentViewers.length === 0 ? (
            <p className="text-sm text-muted-foreground">데이터 없음</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
                <ChartBarMixed
                  title="평균 시청자 수"
                  description="수집 시점당 평균 동시시청자"
                  data={data.byConcurrentViewers}
                  dataKey="concurrentViewers"
                />
                <ChartBarMixed
                  title="방송 수"
                  description="카테고리별 평균 방송 수"
                  data={data.byCount}
                  dataKey="count"
                />
              </div>
              {/* <div className="space-y-16">
                <RankingCards
                  title="최대 동시시청자"
                  description="수집 시점 중 최대 시청자 합산"
                  data={data.byMaxViewers}
                  valueKey="maxViewers"
                  valueLabel="명"
                />
                <RankingCards
                  title="최고 시청자"
                  description="단일 방송 최고 시청자"
                  data={data.byPeakViewers}
                  valueKey="peakViewers"
                  valueLabel="명"
                />
              </div> */}
            </>
          );
        })()
      )}
    </div>
  );
}
