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
  if (score >= 70) return ["#1bb373", "#00e5a0"]; // 초록 계열
  if (score >= 40) return ["#f59e0b", "#1bb373"]; // 주황→초록
  return ["#e24b4a", "#f59e0b"]; // 빨강→주황
}
export function GameScoreCard({ categoryId, allRows, allGames }: Props) {
  const maxViewers = Math.max(...allGames.map((g) => g.concurrentViewers));
  const maxBroadcast = Math.max(...allGames.map((g) => g.broadcastCount));

  const currentGame = allGames.find((g) => g.categoryId === categoryId);
  const currentViewers = currentGame?.concurrentViewers ?? 0;
  const currentBroadcast = currentGame?.broadcastCount ?? 0;

  const viewerPercentile = Math.round(
    (Math.sqrt(currentViewers) / Math.sqrt(maxViewers)) * 100,
  );
  const countPercentile = Math.round(
    (Math.sqrt(currentBroadcast) / Math.sqrt(maxBroadcast)) * 100,
  );

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

  let persistence: number;
  let persistenceLabel: string;
  let persistenceColor: string;

  if (changeRate <= -0.5) {
    persistence = 20;
    persistenceLabel = "급락";
    persistenceColor = "#e24b4a";
  } else if (changeRate <= -0.3) {
    persistence = 40;
    persistenceLabel = "하락세";
    persistenceColor = "#f59e0b";
  } else if (changeRate <= 0.3) {
    persistence = 65;
    persistenceLabel = "유지";
    persistenceColor = "#60a5fa";
  } else if (changeRate <= 1.0) {
    persistence = 85;
    persistenceLabel = "상승세";
    persistenceColor = "#6ee7b7";
  } else {
    persistence = 100;
    persistenceLabel = "급상승";
    persistenceColor = "#1bb373";
  }

  const segments = [
    { color: "#e24b4a", active: persistenceLabel === "급락" },
    { color: "#f59e0b", active: persistenceLabel === "하락세" },
    { color: "#60a5fa", active: persistenceLabel === "유지" },
    { color: "#6ee7b7", active: persistenceLabel === "상승세" },
    { color: "#00ce7a", active: persistenceLabel === "급상승" },
  ];

  const totalScore = Math.round(
    viewerPercentile * 0.4 + countPercentile * 0.3 + persistence * 0.3,
  );

  const color = ScoreRingColor(totalScore);
  const viewerColor = ScoreRingColor(viewerPercentile);
  const countColor = ScoreRingColor(countPercentile);
  const [gradStart, gradEnd] = getGradientColors(totalScore);
  const pct = totalScore;
  console.log("=== 스트림트렌드 인기 점수 디버그 ===");
  console.log("게임:", categoryId);
  console.log("전체 게임 수:", allGames.length);
  console.log("");
  console.log("[시청자]");
  console.log("  현재 시청자:", currentViewers);
  console.log("  최대 시청자:", maxViewers);
  console.log("  로그 점수:", viewerPercentile);
  console.log("");
  console.log("[방송 수]");
  console.log("  현재 방송 수:", currentBroadcast);
  console.log("  최대 방송 수:", maxBroadcast);
  console.log("  로그 점수:", countPercentile);
  console.log("");
  console.log("[지속성]");
  console.log("  최근 3일 평균:", Math.round(recentAvg));
  console.log("  이전 4일 평균:", Math.round(prevAvg));
  console.log("  유지율:", persistence);
  console.log("");
  console.log("[종합]");
  console.log("  시청자 기여:", Math.round(viewerPercentile * 0.4));
  console.log("  방송 수 기여:", Math.round(countPercentile * 0.3));
  console.log("  지속성 기여:", Math.round(persistence * 0.3));
  console.log("  종합 점수:", totalScore);
  console.log("=====================================");

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
              · <span className="text-white/90">시청자 (40%)</span> — 최근 7일
              평균 시청자를 전체 게임 대비 환산해요
            </p>
            <p>
              · <span className="text-white/90">방송 수 (30%)</span> — 최근 7일
              방송 수를 전체 게임 대비 환산해요. 소수 스트리머에 의존하는지
              저변이 넓은지를 반영해요
            </p>
            <p>
              · <span className="text-white/90">추세 (30%)</span> — 최근 3일
              평균 시청자와 이전 4일 평균을 비교해요. 상승 중이면 높은 점수,
              하락 중이면 낮은 점수예요
            </p>
          </div>
        </div>
      </div>

      {/* 종합 점수 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* 종합 점수 링 */}
        <ChartRadialText title="스트림트렌드 인기 점수" value={totalScore} />

        {/* 세부 지표 */}
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
          {/* 추세 */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-muted-foreground">추세</span>
              <span className="text-xs font-medium ">{persistenceLabel}</span>
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
