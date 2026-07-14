// 공통 기본 타입
export type BaseCategoryData = {
  category: string;
  count: number;
  totalViewers: number;
  avgViewers: number;
  concurrentViewers: number;
  maxViewers?: number;
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
  maxViewers: number;
  peakViewers: number;
};

export type TimeSeriesChartProps = {
  title: string;
  description: string;
  data: TimeSeriesData[];
  dataKey: keyof TimeSeriesData;
};
export type GameDateData = {
  date: string;
  concurrentViewers: number;
  maxViewers: number;
  peakViewers: number;
};

export type GamePeriodData = {
  dates: string[];
  games: {
    game: string;
    data: GameDateData[];
  }[];
};
export type TopStreamerEntry = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  maxViewers: number;
  liveTitle: string;
  date: string;
};
