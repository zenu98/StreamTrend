"use client";

import {
  Users,
  Radio,
  LineChart,
  TrendingUp,
  TrendingDown,
  Info,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatKoreanDate } from "@/lib/utils";
type TrendRow = {
  date: string;
  concurrentViewers: number;
  broadcastCount?: number;
};

type Props = {
  viewerPercentile: number;
  countPercentile: number;
  viewerRank: number;

  viewerTieCount: number;
  countTieCount: number;
  totalGames: number;
  totalCountAll: number;
  viewerShare: number;
  countShare: number;
  currentCount: number;
  trendRows?: TrendRow[];
  currentViewers?: number;
  todayLabel?: string;
};

const HIGH = 20;
const LOW = 70;

function classifyQuadrant(currentViewers: number, currentCount: number) {
  // 10,000+
  if (currentViewers >= 10000) {
    if (currentCount >= 80) {
      return {
        label: "폭발적 인기",
        desc: "시청자와 방송 수 모두 최상위권인 오늘의 대표 게임이에요.",
        color: "#34d399",
      };
    }
    if (currentCount >= 50) {
      return {
        label: "트렌드 주도",
        desc: "많은 스트리머가 방송하며 높은 시청자를 기록하고 있어요.",
        color: "#34d399",
      };
    }
    if (currentCount >= 20) {
      return {
        label: "균형 잡힌 인기",
        desc: "방송과 시청자가 균형 있게 많은 인기 게임이에요.",
        color: "#34d399",
      };
    }
    if (currentCount >= 10) {
      return {
        label: "집중 시청",
        desc: "소수의 인기 방송에 시청자가 집중되고 있어요.",
        color: "#34d399",
      };
    }
    return {
      label: "통나무",
      desc: "극소수 방송이 대부분의 시청자를 끌어모으고 있어요.",
      color: "#34d399",
    };
  }

  // 5,000 ~ 9,999
  if (currentViewers >= 5000) {
    if (currentCount >= 80) {
      return {
        label: "폭넓은 인기",
        desc: "여러 방송에 시청자가 고르게 모여있어요.",
        color: "#22d3ee",
      };
    }
    if (currentCount >= 50) {
      return {
        label: "화제의 중심",
        desc: "방송과 시청자가 모두 준수한 수준이에요.",
        color: "#22d3ee",
      };
    }
    if (currentCount >= 20) {
      return {
        label: "탄탄한 팬층",
        desc: "적당한 수의 방송에 관심이 잘 모여있어요.",
        color: "#22d3ee",
      };
    }
    if (currentCount >= 10) {
      return {
        label: "핵심 방송",
        desc: "몇몇 방송을 중심으로 시청자가 모이고 있어요.",
        color: "#22d3ee",
      };
    }
    return {
      label: "소수 정예",
      desc: "방송은 적지만 방송당 시청자가 많은 편이에요.",
      color: "#22d3ee",
    };
  }

  // 2,000 ~ 4,999
  if (currentViewers >= 2000) {
    if (currentCount >= 80) {
      return {
        label: "방송 과열",
        desc: "방송 수에 비해 시청자가 적어 경쟁이 치열한 편이에요.",
        color: "#60a5fa",
      };
    }
    if (currentCount >= 50) {
      return {
        label: "관심 분산",
        desc: "시청자가 여러 방송으로 나뉘어 있는 상태예요.",
        color: "#60a5fa",
      };
    }
    if (currentCount >= 20) {
      return {
        label: "무난한 인기",
        desc: "방송과 시청자가 비교적 균형을 이루고 있어요.",
        color: "#60a5fa",
      };
    }
    if (currentCount >= 10) {
      return {
        label: "관심 집중",
        desc: "일부 방송에 시청자가 몰려있어요.",
        color: "#60a5fa",
      };
    }
    return {
      label: "알짜 방송",
      desc: "적은 수의 방송이 알찬 시청자층을 확보하고 있어요.",
      color: "#60a5fa",
    };
  }

  // 1,000 ~ 1,999
  if (currentViewers >= 1000) {
    if (currentCount >= 80) {
      return {
        label: "방송 포화",
        desc: "방송은 많지만 방송당 시청자가 적은 편이에요.",
        color: "#fbbf24",
      };
    }
    if (currentCount >= 50) {
      return {
        label: "시청자 분산",
        desc: "많은 방송으로 시청자가 분산되어 있어요.",
        color: "#fbbf24",
      };
    }
    if (currentCount >= 20) {
      return {
        label: "무난한 관심",
        desc: "규모는 작지만 방송과 시청자가 균형을 이루고 있어요.",
        color: "#fbbf24",
      };
    }
    if (currentCount >= 10) {
      return {
        label: "매니아층",
        desc: "소규모 팬층이 방송을 챙겨보고 있어요.",
        color: "#fbbf24",
      };
    }
    return {
      label: "숨은 보석",
      desc: "방송은 적지만 열정적인 시청자가 함께하고 있어요.",
      color: "#fbbf24",
    };
  }

  // 500 ~ 999
  if (currentViewers >= 500) {
    if (currentCount >= 80) {
      return {
        label: "과포화",
        desc: "방송 수에 비해 시청자가 매우 적은 편이에요.",
        color: "#fb923c",
      };
    }
    if (currentCount >= 50) {
      return {
        label: "분산 현상",
        desc: "시청자가 여러 방송으로 흩어져 있어요.",
        color: "#fb923c",
      };
    }
    if (currentCount >= 20) {
      return {
        label: "작은 커뮤니티",
        desc: "작지만 활발한 소규모 커뮤니티가 있어요.",
        color: "#fb923c",
      };
    }
    if (currentCount >= 10) {
      return {
        label: "소규모 팬층",
        desc: "적은 인원이 게임을 즐기고 있어요.",
        color: "#fb923c",
      };
    }
    return {
      label: "조용한 인기",
      desc: "방송은 적지만 시청자의 관심은 있는 편이에요.",
      color: "#fb923c",
    };
  }

  // 0 ~ 499
  if (currentCount >= 80) {
    return {
      label: "방송 난립",
      desc: "방송은 많지만 시청자가 크게 부족한 상태예요.",
      color: "#94a3b8",
    };
  }
  if (currentCount >= 50) {
    return {
      label: "관심 부족",
      desc: "방송은 있지만 시청자 유입이 적은 편이에요.",
      color: "#94a3b8",
    };
  }
  if (currentCount >= 20) {
    return {
      label: "소규모 커뮤니티",
      desc: "소수의 방송을 중심으로 작은 커뮤니티가 있어요.",
      color: "#94a3b8",
    };
  }
  if (currentCount >= 10) {
    return {
      label: "조용한 방송",
      desc: "소수의 방송이 진행되고 있어요.",
      color: "#94a3b8",
    };
  }
  return {
    label: "R.I.P",
    desc: "언젠가 다시 만날 날을 기다려요.",
    color: "#94a3b8",
  };
}
function classify(
  currentViewers: number,
  currentCount: number,
  isConcentratedSpike?: boolean,
) {
  const base = classifyQuadrant(currentViewers, currentCount);

  return {
    ...base,
    isStreamerDriven: !!isConcentratedSpike,
  };
}
function rankColor(percentile: number, base: string) {
  if (percentile <= HIGH) return "#34d399";
  if (percentile >= LOW) return "#94a3b8";
  return base;
}

function RankBadge({
  icon,
  label,
  rank,
  totalGames,
  percentile,
  base,
}: {
  icon: React.ReactNode;
  label: string;
  rank: number;
  totalGames: number;
  percentile: number;
  base: string;
}) {
  const color = rankColor(percentile, base);
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
        {icon}
        {label}
      </p>
      <div
        className="inline-flex items-baseline gap-1 rounded-lg px-3 py-1.5"
        style={{ background: `${color}1f` }}
      >
        <span
          className="text-2xl font-semibold translate-y-0.5"
          style={{ color }}
        >
          {rank}위
        </span>
        <span
          className="text-sm translate-y-0.5"
          style={{ color: `${color}b3` }}
        >
          / {totalGames}
        </span>
      </div>
    </div>
  );
}
function ShareBadge({
  icon,
  label,
  value,
  totalGames,
  share,
  percentile,
  base,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  totalGames: number;
  share: number;
  percentile: number;
  base: string;
}) {
  const color = rankColor(percentile, base);
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
        {icon}
        {label}
      </p>
      <div
        className="inline-flex items-baseline gap-1 rounded-lg px-3 py-1.5 "
        style={{ background: `${color}1f` }}
      >
        <span
          className="text-2xl font-semibold translate-y-0.5"
          style={{ color }}
        >
          {value.toLocaleString()}
        </span>
        <span
          className="text-sm translate-y-0.5"
          style={{ color: `${color}b3` }}
        >
          / {totalGames}
        </span>
      </div>
      {/* <p className="mt-1 text-[11px] font-medium" style={{ color }}>
        전체의 {share}%
      </p> */}
    </div>
  );
}
function ConsistencyStrip({
  rows,
  anomalyDates,
  liveIndex,
  color,
}: {
  rows: TrendRow[];
  anomalyDates: Set<string>;
  liveIndex: number;
  color: string;
}) {
  const values = rows.map((r) => r.concurrentViewers);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-1 flex-1 min-h-[80px]">
      {rows.map((row, i) => {
        const heightPct = ((row.concurrentViewers - min) / range) * 100;
        const isAnomaly = anomalyDates.has(row.date);
        const isLive = i === liveIndex;
        const isNearEnd = i >= rows.length - 3; // 마지막 3개는 왼쪽으로

        return (
          <div key={row.date} className="group relative flex-1 h-full">
            <div
              className="absolute bottom-0 w-full rounded-sm transition-opacity"
              style={{
                height: `${Math.max(heightPct, 3)}%`,
                background: isAnomaly ? "#fbbf24" : color,
                opacity: isLive ? 0.5 : 1,
                border: isLive ? `1px dashed ${color}` : undefined,
              }}
            />
            <div
              className={`pointer-events-none absolute -top-6 z-10 whitespace-nowrap rounded bg-background px-1.5 py-0.5 text-[10px] shadow-sm opacity-0 group-hover:opacity-100 ${
                isNearEnd
                  ? "right-0" // 오른쪽 끝 기준으로 붙임
                  : "left-1/2 -translate-x-1/2" // 나머지는 중앙
              }`}
            >
              {row.date}
              {isLive ? " (진행 중)" : ""} ·{" "}
              {row.concurrentViewers.toLocaleString()}명
            </div>
          </div>
        );
      })}
    </div>
  );
}
function analyzeTrend(rows: TrendRow[]) {
  const n = rows.length;
  const values = rows.map((r) => r.concurrentViewers);
  const broadcastCounts = rows.map((r) => r.broadcastCount ?? 0);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const stdev = Math.sqrt(variance);
  const cv = mean > 0 ? stdev / mean : 0;

  // 선형회귀 (기존과 동일)
  const xMean = (n - 1) / 2;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - mean);
    den += (i - xMean) ** 2;
  }
  const slope = den > 0 ? num / den : 0;
  const intercept = mean - slope * xMean;
  const predictedStart = intercept;
  const predictedEnd = intercept + slope * (n - 1);
  const trendChangePct =
    predictedStart > 0
      ? ((predictedEnd - predictedStart) / predictedStart) * 100
      : 0;

  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * i;
    ssRes += (values[i] - predicted) ** 2;
    ssTot += (values[i] - mean) ** 2;
  }
  const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

  // 최근 모멘텀 (최근 3일 vs 그 이전)
  const RECENT_WINDOW = 3;
  const recentCount = Math.min(RECENT_WINDOW, n - 1);
  const recentValues = values.slice(n - recentCount);
  const priorValues = values.slice(0, n - recentCount);
  const recentMean =
    recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
  const priorMean = priorValues.reduce((a, b) => a + b, 0) / priorValues.length;
  const momentumPct =
    priorMean > 0 ? ((recentMean - priorMean) / priorMean) * 100 : 0;

  // 정점 위치 + 정점 이후 며칠째인지
  let peakIdx = 0;
  for (let i = 1; i < n; i++) {
    if (values[i] > values[peakIdx]) peakIdx = i;
  }
  const daysSincePeak = n - 1 - peakIdx;
  const peakDate = rows[peakIdx].date;

  // 마지막 값부터 거슬러 올라가며 연속 상승/하락 길이
  let streakLen = 0;
  let streakDir: "up" | "down" | "flat" = "flat";
  for (let i = n - 1; i > 0; i--) {
    const diff = values[i] - values[i - 1];
    const dir = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
    if (streakLen === 0) {
      if (dir === "flat") break;
      streakDir = dir;
      streakLen = 1;
    } else if (dir === streakDir) {
      streakLen++;
    } else {
      break;
    }
  }

  const ANOMALY_Z_THRESHOLD = 2.5;
  const rawAnomalies = rows
    .map((r, i) => ({
      date: r.date,
      z: stdev > 0 ? (values[i] - mean) / stdev : 0,
      viewersPerBroadcast:
        broadcastCounts[i] > 0 ? values[i] / broadcastCounts[i] : 0,
    }))
    .filter((a) => a.z >= ANOMALY_Z_THRESHOLD);

  // ↓ 추가: 이상치가 아닌 "평소" 날들의 방송당 평균 시청자 = 기준선
  const anomalyDateSet = new Set(rawAnomalies.map((a) => a.date));
  const normalIdx = rows
    .map((_, i) => i)
    .filter((i) => !anomalyDateSet.has(rows[i].date));
  const baselineVPB =
    normalIdx.length > 0
      ? normalIdx.reduce((sum, i) => {
          const vpb =
            broadcastCounts[i] > 0 ? values[i] / broadcastCounts[i] : 0;
          return sum + vpb;
        }, 0) / normalIdx.length
      : 0;

  // ↓ 추가: 기준선 대비 2배 이상이면 "소수(대형 스트리머)가 만든 쏠림"으로 판단
  const CONCENTRATION_MULTIPLIER = 2;
  const anomalies = rawAnomalies.map((a) => ({
    ...a,
    isConcentrated:
      baselineVPB > 0 &&
      a.viewersPerBroadcast >= baselineVPB * CONCENTRATION_MULTIPLIER,
  }));

  const consistencyScore = Math.round(
    Math.max(0, Math.min(100, 100 * (1 - cv))),
  );

  // ↓ 메인 라벨: 이상치를 최우선으로 보지 않고, diverging > peak > momentum > consistency 순으로 결정
  let label: string;
  let color: string;

  const diverging =
    Math.abs(trendChangePct) >= 20 &&
    Math.abs(momentumPct) >= 15 &&
    Math.sign(trendChangePct) !== Math.sign(momentumPct);

  const decliningFromPeak =
    daysSincePeak > 0 && daysSincePeak <= 4 && momentumPct <= -15;
  //   console.log({
  //     rawAnomalies: rawAnomalies.map((a) => ({ date: a.date, z: a.z })),
  //     normalIdx,
  //     baselineVPB,
  //     anomalies: anomalies.map((a) => ({
  //       date: a.date,
  //       isConcentrated: a.isConcentrated,
  //     })),
  //   });
  if (diverging && trendChangePct > 0) {
    label = `기간 전체로는 상승세지만(+${Math.round(trendChangePct)}%), 최근 들어 꺾였어요(${Math.round(momentumPct)}%)`;
    color = "#fb923c";
  } else if (diverging && trendChangePct < 0) {
    label = `기간 전체로는 하락세지만(${Math.round(trendChangePct)}%), 최근 들어 반등했어요(+${Math.round(momentumPct)}%)`;
    color = "#34d399";
  } else if (decliningFromPeak) {
    label =
      daysSincePeak === 1
        ? `어제 정점(${peakDate}) 이후 하락 중이에요`
        : `${daysSincePeak}일 전 정점(${peakDate}) 이후 하락 중이에요`;
    color = "#f87171";
  } else if (momentumPct >= 15) {
    label =
      streakLen >= 3
        ? `${streakLen}일 연속 상승 중이에요 (+${Math.round(momentumPct)}%)`
        : `최근 들어 상승세예요 (직전 대비 +${Math.round(momentumPct)}%)`;
    color = "#34d399";
  } else if (momentumPct <= -15) {
    label =
      streakLen >= 3
        ? `${streakLen}일 연속 하락 중이에요 (${Math.round(momentumPct)}%)`
        : `최근 들어 하락세예요 (직전 대비 ${Math.round(momentumPct)}%)`;
    color = "#f87171";
  } else if (consistencyScore >= 65) {
    label = "꾸준한 인기예요";
    color = "#34d399";
  } else {
    label = "인기가 들쭉날쭉해요";
    color = "#60a5fa";
  }

  let anomalyNote: string | null = null;

  if (anomalies.length > 0) {
    anomalyNote = anomalies
      .map((a) =>
        a.isConcentrated
          ? `${formatKoreanDate(a.date)} 대형 스트리머 영향으로 급상승`
          : `${formatKoreanDate(a.date)} 급상승`,
      )
      .join(", ");

    const hasConcentrated = anomalies.some((a) => a.isConcentrated);
    if (
      color === "#60a5fa" ||
      (color === "#34d399" &&
        !diverging &&
        !decliningFromPeak &&
        momentumPct < 15)
    ) {
      color = hasConcentrated ? "#f472b6" : "#fbbf24";
    }
  }

  return {
    values,
    consistencyScore,
    trendChangePct,
    momentumPct,
    r2,
    peakDate,
    peakValue: values[peakIdx],
    daysSincePeak,
    streakLen,
    streakDir,
    anomalies,
    label, // ← 이제 이상치 문구 안 섞인 순수 메인 라벨
    anomalyNote, // ← 새 필드, 없으면 null
    color,
  };
}

type ChartPoint = {
  date: string;
  historical: number | null;
  live: number | null;
  isAnomaly: boolean;
  isLive: boolean;
};

function TrendArea({
  combined,
  hasLive,
  analysis,
}: {
  combined: TrendRow[];
  hasLive: boolean;
  analysis: ReturnType<typeof analyzeTrend>;
}) {
  const anomalyDates = new Set(analysis.anomalies.map((a) => a.date));
  const liveIndex = hasLive ? combined.length - 1 : -1;

  const peakLabel =
    analysis.daysSincePeak === 0
      ? "오늘"
      : analysis.daysSincePeak === 1
        ? "어제"
        : `${analysis.daysSincePeak}일 전`;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <LineChart className="h-4 w-4 text-muted-foreground" />
          인기 지속성 · 최근 {combined.length}일
        </p>

        <div className="flex flex-col items-end gap-0.5 text-right">
          <span
            className="text-xs font-medium"
            style={{ color: analysis.color }}
          >
            {analysis.label}
          </span>
          {analysis.anomalyNote && (
            <span className="text-xs  text-pink-400">
              {analysis.anomalyNote}
            </span>
          )}
        </div>
      </div>

      <ConsistencyStrip
        rows={combined}
        anomalyDates={anomalyDates}
        liveIndex={liveIndex}
        color={analysis.color}
      />

      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>{combined[0]?.date}</span>
        <span>
          {hasLive
            ? `${combined[combined.length - 1]?.date} (진행 중)`
            : combined[combined.length - 1]?.date}
        </span>
      </div>

      <div className="mt-1 grid grid-cols-4 gap-3 border-t pt-3 text-center">
        <div>
          <p className="text-[11px] text-muted-foreground">일관성</p>
          <p className="text-sm font-semibold">{analysis.consistencyScore}점</p>
        </div>
        <div>
          <p className="flex items-center justify-center gap-0.5 text-[11px] text-muted-foreground">
            {analysis.trendChangePct >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            기간 추세
          </p>
          <p className="text-sm font-semibold">
            {analysis.trendChangePct >= 0 ? "+" : ""}
            {Math.round(analysis.trendChangePct)}%
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">최근 모멘텀</p>
          <p className="text-sm font-semibold">
            {analysis.momentumPct >= 0 ? "+" : ""}
            {Math.round(analysis.momentumPct)}%
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">피크</p>
          <p className="text-sm font-semibold">{peakLabel}</p>
        </div>
      </div>
    </div>
  );
}

export function ViewerConcentrationSection({
  viewerPercentile,
  countPercentile,
  viewerRank,

  viewerTieCount,

  totalGames,
  totalCountAll,
  viewerShare,
  countShare,
  trendRows,
  currentViewers,
  todayLabel,
  currentCount,
}: Props) {
  const base = (trendRows ?? []).slice(-13);
  const hasLive = currentViewers != null && !!todayLabel;

  const combined: TrendRow[] = hasLive
    ? [
        ...base.filter((r) => r.date !== todayLabel),
        {
          date: todayLabel!,
          concurrentViewers: currentViewers!,
          broadcastCount: currentCount,
        },
      ]
    : base;

  const analysis = combined.length >= 4 ? analyzeTrend(combined) : null;

  // "오늘"(가장 최근 날짜)이 이 게임 기준으로 튀었고, 소수 방송에 몰린 이상치인지
  const todayEntry = combined[combined.length - 1];
  const todayIsConcentratedSpike =
    !!todayEntry &&
    !!analysis &&
    analysis.anomalies.some(
      (a) => a.date === todayEntry.date && a.isConcentrated,
    );

  const quadrant = classify(
    currentViewers ?? 0,
    currentCount,
    todayIsConcentratedSpike,
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">시청자 집중도</CardTitle>
        <CardDescription className="text-xs">
          전체 게임 대비 순위와 최근 추이
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 pb-4 md:grid-cols-[minmax(0,350px)_1fr] md:items-stretch">
        <div className="space-y-4">
          <div className="flex gap-3">
            <RankBadge
              icon={<Users className="h-3.5 w-3.5" />}
              label="시청자 순위"
              rank={viewerRank}
              totalGames={totalGames}
              percentile={viewerPercentile}
              base="var(--chart-1)"
            />
            <ShareBadge
              icon={<Radio className="h-3.5 w-3.5" />}
              label="방송 점유율"
              value={currentCount}
              totalGames={totalCountAll}
              share={countShare}
              percentile={countPercentile}
              base="var(--chart-2)"
            />
          </div>

          <div
            className="flex items-start gap-2.5 rounded-lg border px-3 py-3"
            style={{
              borderColor: `${quadrant.color}33`,
              background: `${quadrant.color}0f`,
            }}
          >
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-full"
              style={{ background: quadrant.color }}
            />
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: quadrant.color }}
              >
                {quadrant.label}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {totalGames}개 게임 중 시청자{" "}
                {viewerTieCount > 1
                  ? `공동 ${viewerRank}위`
                  : `${viewerRank}위`}
                (전체의 {viewerShare}%)이고, 방송은 전체의 {countShare}%를
                차지해요. {quadrant.desc}
              </p>
            </div>
          </div>

          {/* ↓ 대형 스트리머 효과 별도 카드 */}
          {quadrant.isStreamerDriven && (
            <div
              className="flex items-start gap-2.5 rounded-lg border px-3 py-3"
              style={{
                borderColor: "#f472b633",
                background: "#f472b60f",
              }}
            >
              <Zap
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                style={{ color: "#f472b6" }}
              />
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#f472b6" }}
                >
                  대형 스트리머 효과
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  오늘 시청자가 평소보다 크게 늘었어요 — 대회·이벤트·인기
                  스트리머의 방송 등 특별한 요인이 있을 수 있어요.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-between border-t pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0 md:h-full">
          {analysis ? (
            <div className="w-full h-full flex flex-col">
              <TrendArea
                combined={combined}
                hasLive={hasLive}
                analysis={analysis}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              추이 데이터가 부족해요
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
