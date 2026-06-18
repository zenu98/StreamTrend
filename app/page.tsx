import { CategoryPieChart } from "@/components/ui/charts/chart-pie-legend";
import { getStats } from "@/lib/stats";
import { getLives } from "@/lib/lives";
import { ChartBarMixed } from "@/components/ui/charts/bar-chart-mixed";
import { Suspense } from "react";
import { LiveSection } from "@/components/shared/LiveSection";
import { ChartBarLabel } from "@/components/ui/charts/bar-chart-label";
import { ChartBarLabelCustom } from "@/components/ui/charts/chart-bar-label-custom";

export default async function Home() {
  const [daily, weekly, monthly] = await Promise.all([
    getStats("daily"),
    getStats("weekly"),
    getStats("monthly"),
  ]);

  return (
    <main className="p-8 space-y-12">
      {/* 실시간 */}

      <LiveSection />

      {/* 일간 / 주간 / 월간 */}
      <section>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "📅 어제", data: daily },
            { label: "📅 주간", data: weekly },
            // { label: "📅 월간", data: monthly },
          ].map(({ label, data }) => (
            <div key={label} className="space-y-4">
              <h2 className="text-xl font-bold">{label}</h2>
              <ChartBarMixed
                title="시청자 수"
                description="카테고리별 시청자 수"
                data={data.byConcurrentViewers}
                dataKey="concurrentViewers"
              />
              <ChartBarMixed
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
