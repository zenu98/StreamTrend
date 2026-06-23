import type { ChartConfig } from "@/components/ui/chart";
import type { BaseCategoryData } from "@/types/chart";

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

export function buildChartData<T extends BaseCategoryData>(
  data: T[],
  dataKey: keyof T,
) {
  return [...data].map((item, index) => ({
    category: item.category,
    value: (item[dataKey] as number) ?? 0,
    fill: COLORS[index % COLORS.length],
  }));
}

export function buildChartConfig<T extends BaseCategoryData>(
  data: T[],
): ChartConfig {
  return data.reduce((acc, item, index) => {
    acc[item.category] = {
      label: item.category,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);
}

export function getTier(maxViewers: number) {
  if (maxViewers >= 100000) return "S";
  if (maxViewers >= 50000) return "A";
  if (maxViewers >= 10000) return "B";
  return "C";
}
