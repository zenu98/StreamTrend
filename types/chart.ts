export type CategoryData = {
  category: string;
  count: number;
  totalViewers: number;
  avgViewers: number;
};

export type ChartProps = {
  title: string;
  description: string;
  data: CategoryData[];
  dataKey: "totalViewers" | "count";
  valueLabel?: string;
};
