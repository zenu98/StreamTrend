import { Info } from "lucide-react";
import { ChartRadialText } from "../ui/charts/chart-radial-text";

function ScoreRingColor(score: number) {
  if (score >= 80) return "#00ce7a";
  if (score >= 60) return "#23ba7e";
  if (score >= 40) return "#60a5fa";
  if (score >= 20) return "#f59e0b";
  return "#e24b4a";
}

type Props = {
  categoryId: string;
  allRows: { concurrentViewers: number }[];
  allGames: {
    categoryId: string;
    concurrentViewers: number;
    broadcastCount: number;
  }[];
};

function getGradientColors(score: number): [string, string] {
  if (score >= 70) return ["#1bb373", "#00e5a0"];
  if (score >= 40) return ["#f59e0b", "#1bb373"];
  return ["#e24b4a", "#f59e0b"];
}

export function GameScoreCard({ categoryId, allRows, allGames }: Props) {
  const sortedByViewers = [...allGames].sort(
    (a, b) => b.concurrentViewers - a.concurrentViewers,
  );
  const sortedByBroadcast = [...allGames].sort(
    (a, b) => b.broadcastCount - a.broadcastCount,
  );

  // 이제 1등을 그대로 기준값으로 사용 (대회 시청자 왜곡이 없으니 2등 우회 불필요)
  const maxViewers = sortedByViewers[0]?.concurrentViewers || 1;
  const maxBroadcast = sortedByBroadcast[0]?.broadcastCount || 1;

  const currentGame = allGames.find((g) => g.categoryId === categoryId);
  const currentViewers = currentGame?.concurrentViewers ?? 0;
  const currentBroadcast = currentGame?.broadcastCount ?? 0;

  const viewerPercentile = Math.round(
    (Math.sqrt(currentViewers) / Math.sqrt(maxViewers)) * 100,
  );
  const countPercentile = Math.round(
    (Math.sqrt(currentBroadcast) / Math.sqrt(maxBroadcast)) * 100,
  );

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

  let trendLabel: string;
  if (changeRate <= -0.3) {
    trendLabel = "하락세";
  } else if (changeRate >= 0.3) {
    trendLabel = "상승세";
  } else {
    trendLabel = "유지";
  }

  const segments = [
    { color: "#e24b4a", active: trendLabel === "하락세" },
    { color: "#f59e0b", active: trendLabel === "유지" },
    { color: "#00ce7a", active: trendLabel === "상승세" },
  ];

  const color = ScoreRingColor(totalScore);
  const viewerColor = ScoreRingColor(viewerPercentile);
  const countColor = ScoreRingColor(countPercentile);
  const [gradStart, gradEnd] = getGradientColors(totalScore);

  return (
    <div className="rounded-2xl border bg-card px-5 py-5 space-y-4 sm:min-w-[45%] sm:w-fit">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-muted-foreground">
          스트림트렌드 인기 점수
        </p>
        <div className="relative group">
          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
          <div className="absolute left-0 top-full mt-2 w-72 p-3 rounded-lg bg-white/10 backdrop-blur-sm text-xs text-white/70 hidden group-hover:block z-10 space-y-2">
            <p className="font-semibold text-white/90 mb-1">점수 계산 기준</p>
            <p>
              · <span className="text-white/90">시청자 (60%)</span> — 최근 7일
              평균 동시시청자의 제곱근을 전체 게임 중 최고치의 제곱근으로 나눠
              0~100점으로 환산해요
            </p>
            <p>
              · <span className="text-white/90">방송 수 (40%)</span> — 최근 7일
              방송 수의 제곱근을 전체 게임 중 최고치의 제곱근으로 나눠
              0~100점으로 환산해요
            </p>
            <p>
              · <span className="text-white/90">추세</span>는 점수에 반영되지
              않고, 최근 3일 평균과 이전 4일 평균을 비교해 참고용으로만
              보여드려요
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
