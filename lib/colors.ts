// 게임/스트리머 통계 화면 전반에서 쓰는 색상 로직 모음.
// (기존엔 components/main/TrendingGame.tsx, components/game/GameScoreCard.tsx 등
//  여러 파일에 각각 따로 정의돼 있었음 — 여기로 통합)

/**
 * 시청자/방송수 비율(percentile)처럼 0~100 단일 값을 5단계로 나눠 색칠할 때 쓰는 색.
 * 게임 상세 페이지의 진행률 바, 링 차트 등에서 사용.
 */
export function getScoreRingColor(score: number): string {
  if (score >= 80) return "#00ce7a";
  if (score >= 60) return "#23ba7e";
  if (score >= 40) return "#60a5fa";
  if (score >= 20) return "#f59e0b";
  return "#e24b4a";
}

/**
 * 인기 점수(totalScore) 배지의 텍스트 그라데이션 색상 (3단계).
 * ScoreBadge 등에서 사용.
 */
export function getScoreGradientColors(score: number): [string, string] {
  if (score >= 70) return ["#f59e0b", "#1bb373"];
  if (score >= 40) return ["#e24b4a", "#f59e0b"];
  return ["#e24b4a", "#f97316"];
}

/** 하락세/유지/상승세 3구간 공용 색상 (빨강/주황/초록) */
export const TREND_COLORS = ["#e24b4a", "#f59e0b", "#00ce7a"] as const;

export type TrendLabel = "하락세" | "유지" | "상승세";

/**
 * changeRate(전일 대비 증감률)를 3단계 추세로 분류.
 * -0.3 이하는 하락세, +0.3 이상은 상승세, 그 사이는 유지.
 */
export function getTrendSegments(changeRate?: number): {
  label: TrendLabel;
  activeIndex: 0 | 1 | 2;
} {
  const rate = changeRate ?? 0;
  if (rate <= -0.3) return { label: "하락세", activeIndex: 0 };
  if (rate >= 0.3) return { label: "상승세", activeIndex: 2 };
  return { label: "유지", activeIndex: 1 };
}
