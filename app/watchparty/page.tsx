import { getLives } from "@/lib/lives";
import { getWatchpartyStats } from "@/lib/watchpartytStats";
import { ChartBarMixed } from "@/components/ui/charts/bar-chart-mixed";
import { CategoryPieChart } from "@/components/ui/charts/chart-pie-legend";

export default async function WatchpartyPage() {
  const [lives, daily, weekly, monthly] = await Promise.all([
    getLives(),
    getWatchpartyStats("daily"),
    getWatchpartyStats("weekly"),
    getWatchpartyStats("monthly"),
  ]);

  return (
    <main className="p-4 md:p-8 space-y-12">
      {/* 실시간 */}
      <section className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {new Date(lives.collectedAt).toLocaleString("ko-KR", {
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
            data={lives.sportsByViewers}
            dataKey="totalViewers"
            valueLabel="시청자: "
          />
          <ChartBarMixed
            title="방송 수"
            description="현재 카테고리별 방송 수"
            data={lives.sportsByCount}
            dataKey="count"
            valueLabel="방송: "
          />
        </div>
      </section>

      {/* 일간 / 주간 / 월간 */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "📅 일간", data: daily },
            { label: "📅 주간", data: weekly },
            { label: "📅 월간", data: monthly },
          ].map(({ label, data }) => (
            <div key={label} className="space-y-4">
              <h2 className="text-xl font-bold">{label}</h2>
              <CategoryPieChart
                title="시청자 수"
                description="카테고리별 시청자 수"
                data={data.byViewers}
                dataKey="totalViewers"
              />
              <CategoryPieChart
                title="방송 수"
                description="카테고리별 방송 수"
                data={data.byCount}
                dataKey="count"
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
