import type { ChartConfig } from "@/components/ui/chart";
import type { CategoryData } from "@/types/chart";

export const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
  "var(--chart-9)",
  "var(--chart-10)",
  "var(--chart-11)",
  "var(--chart-12)",
  "var(--chart-13)",
  "var(--chart-14)",
  "var(--chart-15)",
  "var(--chart-16)",
  "var(--chart-17)",
  "var(--chart-18)",
  "var(--chart-19)",
  "var(--chart-20)",
  "var(--chart-21)",
  "var(--chart-22)",
  "var(--chart-23)",
  "var(--chart-24)",
  "var(--chart-25)",
  "var(--chart-26)",
  "var(--chart-27)",
  "var(--chart-28)",
  "var(--chart-29)",
  "var(--chart-30)",
];

export function buildChartData(
  data: CategoryData[],
  dataKey: "totalViewers" | "count",
) {
  return [...data]
    .sort((a, b) => b[dataKey] - a[dataKey]) // dataKey 기준 정렬 추가
    .map((item, index) => ({
      category: item.category,
      value: item[dataKey],
      fill: COLORS[index % COLORS.length],
    }));
}

export function buildChartConfig(data: CategoryData[]): ChartConfig {
  return data.reduce((acc, item, index) => {
    acc[item.category] = {
      label: item.category,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);
}
