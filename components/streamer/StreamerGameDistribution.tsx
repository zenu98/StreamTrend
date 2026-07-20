import { formatDuration } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

type CategoryRow = {
  category: string;
  categoryId: string;
  count: number; // 5분 틱 개수
};

type Props = {
  rows: CategoryRow[];
  title?: string;
  description?: string;
};

export function StreamerGameDistribution({
  rows,
  title = "방송 비중",
  description = "게임별 방송 시간",
}: Props) {
  const sorted = [...rows].sort((a, b) => b.count - a.count);
  const max = Math.max(...sorted.map((r) => r.count), 1);
  const total = sorted.reduce((sum, r) => sum + r.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">데이터 없음</p>
      ) : (
        <CardContent className="space-y-4">
          {sorted.map((row, i) => {
            const color = `var(--chart-${(i % 30) + 1})`;
            const percent =
              total > 0 ? Math.round((row.count / total) * 100) : 0;
            const filled = Math.round((row.count / max) * 100);

            return (
              <div key={row.categoryId}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{row.category}</span>
                  <span className="font-semibold" style={{ color }}>
                    {formatDuration(row.count)} · {percent}%
                  </span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${filled}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
