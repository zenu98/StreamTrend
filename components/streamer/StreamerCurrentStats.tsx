import { Users, Clock, Radio } from "lucide-react";
import { formatDuration } from "@/lib/utils";

const tierGradients: Record<string, string> = {
  S: "linear-gradient(90deg, #A855F7, #EC4899)",
  A: "linear-gradient(90deg, #F97316, #EF4444)",
  B: "linear-gradient(90deg, #3B82F6, #06B6D4)",
  C: "linear-gradient(90deg, #94A3B8, #CBD5E1)",
  default: "linear-gradient(90deg, #6366F1, #8B5CF6)",
};

function GradientNumber({ value, tier }: { value: string; tier?: string }) {
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage:
          tierGradients[tier ?? "default"] ?? tierGradients.default,
      }}
    >
      {value}
    </span>
  );
}

type TodayGame = {
  category: string;
  categoryId: string;
  count: number; // 5분 틱 개수
  totalViewers: number;
};

type Props = {
  todayGames: TodayGame[];
};

export function StreamerCurrentStats({ todayGames }: Props) {
  const sorted = [...todayGames].sort((a, b) => b.count - a.count);
  const totalCount = sorted.reduce((sum, g) => sum + g.count, 0);
  const totalViewersSum = sorted.reduce((sum, g) => sum + g.totalViewers, 0);
  const todayAvgViewers =
    totalCount > 0 ? Math.round(totalViewersSum / totalCount) : 0;

  return (
    <div className="w-full min-w-0 max-w-full rounded-2xl border bg-card px-5 py-4 sm:w-fit sm:min-w-[50%]">
      <div className="flex flex-col  md:gap-6 md:flex-row md:items-stretch">
        <div className="flex shrink-0 flex-col ">
          <p className="mb-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>오늘 평균 시청자</span>
          </p>
          <div className="flex flex-1 items-center md:justify-center">
            <p className="whitespace-nowrap text-4xl font-semibold">
              <GradientNumber value={todayAvgViewers.toLocaleString()} />
              <span className="ml-0.5 text-sm font-normal text-muted-foreground">
                명
              </span>
            </p>
          </div>
        </div>

        <div className="hidden w-px self-stretch bg-border md:block " />
        <div className="h-px bg-border md:hidden" />

        <div className="min-w-0 flex-1">
          <p className="mb-2.5 mt-2.5 md:mt-0 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Radio className="h-3.5 w-3.5" />
            <span>오늘의 방송 비중</span>
          </p>
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              오늘 방송 기록이 없어요
            </p>
          ) : (
            <div className="space-y-2">
              {sorted.map((g, i) => {
                const percent =
                  totalCount > 0 ? Math.round((g.count / totalCount) * 100) : 0;
                const color = `var(--chart-${(i % 30) + 1})`;
                return (
                  <div key={g.categoryId}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="truncate font-medium">{g.category}</span>
                      <span
                        className="flex shrink-0 items-center gap-1 font-semibold"
                        style={{ color }}
                      >
                        <Clock className="h-3 w-3" />
                        {formatDuration(g.count)} · {percent}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${percent}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
