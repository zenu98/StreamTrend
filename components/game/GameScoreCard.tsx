import { Info } from "lucide-react";
import { ChartRadialText } from "../ui/charts/chart-radial-text";
import {
  getScoreRingColor,
  getTrendSegments,
  TREND_COLORS,
} from "@/lib/colors";

type Props = {
  categoryId: string;
  allRows: { concurrentViewers: number }[];
  allGames: {
    categoryId: string;
    concurrentViewers: number;
    broadcastCount: number;
  }[];
};

function percentileValue(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx];
}

function topAverage(values: number[], topN: number): number {
  const sorted = [...values].sort((a, b) => b - a);
  const top = sorted.slice(0, topN);
  if (top.length === 0) return 1;
  return top.reduce((sum, v) => sum + v, 0) / top.length;
}

function hyperbolicScore(value: number, reference: number): number {
  if (reference <= 0) return value > 0 ? 100 : 1;
  return Math.round((100 * value) / (value + reference));
}
export function GameScoreCard({ categoryId, allRows, allGames }: Props) {
  const currentGame = allGames.find((g) => g.categoryId === categoryId);
  const currentViewers = currentGame?.concurrentViewers ?? 0;
  const currentBroadcast = currentGame?.broadcastCount ?? 0;

  const viewerValues = allGames.map((g) => g.concurrentViewers);
  const broadcastValues = allGames.map((g) => g.broadcastCount);

  // 상위 20개 평균의 일부(30%)를 "50점 기준선"으로 삼음
  const viewerReference = topAverage(viewerValues, 20) * 0.3;
  const broadcastReference = topAverage(broadcastValues, 20) * 0.3;

  const viewerPercentile = hyperbolicScore(currentViewers, viewerReference);
  const countPercentile = hyperbolicScore(currentBroadcast, broadcastReference);

  // 최소 1점 보장 (방송 수/시청자 0인 경우 대비)
  const totalScore = Math.max(
    1,
    Math.round(viewerPercentile * 0.6 + countPercentile * 0.4),
  );

  // 추세는 점수에 영향 없이 표시 전용
  const recent3 = allRows.slice(-3);
  const prev4 = allRows.slice(-7, -3);
  const recentAvg =
    recent3.reduce((s, r) => s + r.concurrentViewers, 0) /
    (recent3.length || 1);
  const prevAvg =
    prev4.reduce((s, r) => s + r.concurrentViewers, 0) / (prev4.length || 1);

  const diff = recentAvg - prevAvg;
  const avg = (recentAvg + prevAvg) / 2;
  const changeRate = avg > 0 ? diff / avg : 0;

  const { label: trendLabel, activeIndex: trendActiveIndex } =
    getTrendSegments(changeRate);

  const segments = TREND_COLORS.map((color, i) => ({
    color,
    active: i === trendActiveIndex,
  }));

  const viewerColor = getScoreRingColor(viewerPercentile);
  const countColor = getScoreRingColor(countPercentile);

  return (
    <div className="rounded-2xl border bg-card px-5 py-5 space-y-4 sm:min-w-[45%] sm:w-fit">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-muted-foreground">
          스트림트렌드 인기 점수
        </p>
        <div className="relative group">
          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
          <div className="absolute left-0 top-full mt-2 w-80 p-3 rounded-lg bg-white/10 backdrop-blur-sm text-xs text-white/70 hidden group-hover:block z-10 space-y-2">
            <p className="font-semibold text-white/90 mb-1">점수 계산 기준</p>
            <p>
              · <span className="text-white/90">시청자 (60%)</span> — 상위 20개
              게임의 최근 7일 평균 동시시청자를 구해, 그 평균값의 30%를
              기준선으로 삼아요. 현재 게임의 시청자가 기준선과 같으면 50점,
              기준선보다 많으면 50점을 넘고, 적으면 50점 밑으로 내려가요.
            </p>
            <p>
              · <span className="text-white/90">방송 수 (40%)</span> — 같은
              방식으로, 상위 20개 게임의 평균 방송 수의 30%를 기준선으로 삼아
              0~100점으로 환산해요.
            </p>
            <p>
              · 기준선을 전체 1등이 아니라 상위권 평균으로 잡은 이유는, 비활성
              카테고리가 많은 상태에서도 점수가 소수 상위권에만 쏠리지 않고
              고르게 나뉘도록 하기 위해서예요.
            </p>
            <p>
              · <span className="text-white/90">추세</span>는 점수에 반영되지
              않고, 최근 3일 평균과 이전 4일 평균을 비교해 참고용으로만
              보여드려요.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <ChartRadialText title="스트림트렌드 인기 점수" value={totalScore} />

        <div className="flex-1 space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-muted-foreground">시청자</span>
              <span className="text-xs font-medium">{viewerPercentile}점</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${viewerPercentile}%`,
                  background: viewerColor,
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-muted-foreground">방송 수</span>
              <span className="text-xs font-medium">{countPercentile}점</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${countPercentile}%`, background: countColor }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-muted-foreground">추세</span>
              <span className="text-xs font-medium">{trendLabel}</span>
            </div>
            <div className="flex gap-1">
              {segments.map((seg, i) => (
                <div
                  key={i}
                  className="flex-1 h-1.5 rounded-full"
                  style={{
                    background: seg.color,
                    opacity: seg.active ? 1 : 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
