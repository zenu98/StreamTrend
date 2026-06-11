import { getLives } from "@/lib/lives";
import { ChartBarMixed } from "../ui/charts/bar-chart-mixed";

export async function LiveSection() {
  const lives = await getLives();
  return (
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
      <div className="grid grid-cols-2 gap-4">
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
    </section>
  );
}
