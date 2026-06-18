export type CategoryData = {
  category: string;
  count: number;
  totalViewers: number;
  avgViewers: number;
  concurrentViewers: number;
};

export type ChartProps = {
  title: string;
  description: string;
  data: CategoryData[];
  dataKey: "totalViewers" | "count" | "avgViewers" | "concurrentViewers";
  valueLabel?: string;
};

export type TimeSeriesData = {
  date: string;
  totalViewers: number;
  broadcastCount: number;
  concurrentViewers: number;
};

export type TimeSeriesChartProps = {
  title: string;
  description: string;
  data: TimeSeriesData[];
  dataKey: "totalViewers" | "broadcastCount" | "concurrentViewers";
};
