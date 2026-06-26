// 공통 기본 타입
export type BaseCategoryData = {
  category: string;
  count: number;
  totalViewers: number;
  avgViewers: number;
  concurrentViewers: number;
  posterImageUrl?: string | null;
  categoryId: string;
};

// 통계 페이지용
export type StatsCategoryData = BaseCategoryData & {
  maxViewers: number;
  peakViewers: number;
};

// 차트 Props
export type BaseChartProps = {
  title: string;
  description: string;
  valueLabel?: string;
};

export type ChartProps = BaseChartProps & {
  data: BaseCategoryData[];
  dataKey: keyof BaseCategoryData;
};

export type StatsChartProps = BaseChartProps & {
  data: StatsCategoryData[];
  dataKey: keyof StatsCategoryData;
};

// 시계열 차트용
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
  dataKey: keyof TimeSeriesData;
};
