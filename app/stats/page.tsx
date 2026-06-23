import { getStats, getStatsByDate } from "@/lib/stats";
import { ChartBarMixed } from "@/components/ui/charts/bar-chart-mixed";
import { GameCompareChart } from "@/components/shared/GameCompareChart";
import { Suspense } from "react";
import { getLives } from "@/lib/lives";
import { RankingCards } from "@/components/ui/charts/ranking-card-chart";

export default async function StatsPage() {
  const [daily, weekly, monthly, weeklyByDate, monthlyByDate, lives] =
    await Promise.all([
      getStats("daily"),
      getStats("weekly"),
      getStats("monthly"),
      getStatsByDate("weekly"),
      getStatsByDate("monthly"),
      getLives(),
    ]);
  const top3Games = lives.byViewers.slice(0, 3).map((d) => d.category);
  const periods = [
    { label: "어제", data: daily },
    { label: "최근 7일", data: weekly },
    { label: "최근 30일", data: monthly },
  ];

  return (
    <main className="p-4 md:p-8 space-y-12">
      <h1 className="text-2xl md:text-3xl font-bold">통계</h1>

      <Suspense
        fallback={<div className="text-muted-foreground">로딩 중...</div>}
      >
        <GameCompareChart
          defaultGames={top3Games}
          weekly={weeklyByDate}
          monthly={monthlyByDate}
        />
      </Suspense>

      {periods.map(({ label, data }) => (
        <section key={label} className="space-y-4">
          <h2 className="text-xl font-bold">{label}</h2>
          {data.byConcurrentViewers.length === 0 ? (
            <p className="text-sm text-muted-foreground">데이터 없음</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="space-y-4">
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
              </div>
            </div>
          )}
        </section>
      ))}
    </main>
  );
}
