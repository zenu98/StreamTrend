"use client";

import {
  Users,
  Radio,
  LineChart,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TrendRow = { date: string; concurrentViewers: number };

type Props = {
  viewerPercentile: number;
  countPercentile: number;
  viewerRank: number;
  countRank: number;
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

function classify(currentViewers: number, currentCount: number) {
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
    label: "한적한 게임",
    desc: "방송과 시청자가 모두 적어 여유롭게 즐길 수 있는 게임이에요.",
    color: "#94a3b8",
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
function analyzeTrend(rows: TrendRow[]) {
  const n = rows.length;
  const values = rows.map((r) => r.concurrentViewers);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const stdev = Math.sqrt(variance);
  const cv = mean > 0 ? stdev / mean : 0;

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

  const half = Math.floor(n / 2);
  const firstHalfMean =
    values.slice(0, half).reduce((a, b) => a + b, 0) / Math.max(1, half);
  const secondHalfMean =
    values.slice(half).reduce((a, b) => a + b, 0) / Math.max(1, n - half);
  const momentumPct =
    firstHalfMean > 0
      ? ((secondHalfMean - firstHalfMean) / firstHalfMean) * 100
      : 0;

  const anomalies = rows
    .map((r, i) => ({
      date: r.date,
      z: stdev > 0 ? (values[i] - mean) / stdev : 0,
    }))
    .filter((a) => a.z >= 2);

  const consistencyScore = Math.round(
    Math.max(0, Math.min(100, 100 * (1 - cv))),
  );

  let label: string;
  let color: string;
  if (anomalies.length > 0) {
    label = `${anomalies.map((a) => a.date).join(", ")}에 통계적으로 튄 방송이 있었어요`;
    color = "#fbbf24";
  } else if (momentumPct >= 15) {
    label = `최근 들어 상승세예요 (전반 대비 +${Math.round(momentumPct)}%)`;
    color = "#34d399";
  } else if (momentumPct <= -15) {
    label = `최근 들어 하락세예요 (전반 대비 ${Math.round(momentumPct)}%)`;
    color = "#f87171";
  } else if (consistencyScore >= 65) {
    label = "꾸준한 인기예요";
    color = "#34d399";
  } else {
    label = "인기가 들쭉날쭉해요";
    color = "#60a5fa";
  }

  return {
    values,
    consistencyScore,
    trendChangePct,
    momentumPct,
    anomalies,
    label,
    color,
  };
}

function TrendArea({
  rows,
  liveViewers,
  liveLabel,
}: {
  rows: TrendRow[];
  liveViewers?: number;
  liveLabel?: string;
}) {
  const base = rows.slice(-13);
  const hasLive =
    liveViewers != null &&
    !!liveLabel &&
    liveLabel !== base[base.length - 1]?.date;

  const combined: (TrendRow & { live?: boolean })[] = hasLive
    ? [
        ...base,
        { date: liveLabel!, concurrentViewers: liveViewers!, live: true },
      ]
    : base;

  if (combined.length < 4) return null;

  const analysis = analyzeTrend(combined);
  const { values } = analysis;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const width = 480;
  const height = 110;
  const padY = 10;
  const coords = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - padY - ((v - min) / range) * (height - padY * 2);
    return [x, y] as const;
  });

  const liveIndex = hasLive ? coords.length - 1 : -1;
  const solidCoords = liveIndex > 0 ? coords.slice(0, liveIndex) : coords;
  const solidPoints = solidCoords
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const allPoints = coords
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const areaPoints = `0,${height} ${allPoints} ${width},${height}`;

  const anomalyDates = new Set(analysis.anomalies.map((a) => a.date));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <LineChart className="h-4 w-4 text-muted-foreground" />
          인기 지속성 · 최근 {combined.length}일
        </p>
        <span className="text-xs font-medium" style={{ color: analysis.color }}>
          {analysis.label}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        height={110}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={analysis.color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={analysis.color} stopOpacity={0} />
          </linearGradient>
        </defs>

        <polygon points={areaPoints} fill="url(#trendFill)" />

        <polyline
          points={solidPoints}
          fill="none"
          stroke={analysis.color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {liveIndex > 0 && (
          <line
            x1={coords[liveIndex - 1][0]}
            y1={coords[liveIndex - 1][1]}
            x2={coords[liveIndex][0]}
            y2={coords[liveIndex][1]}
            stroke={analysis.color}
            strokeWidth={2}
            strokeDasharray="4 3"
            strokeLinecap="round"
          />
        )}

        {coords.map(([x, y], i) => {
          if (i === liveIndex) {
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={4}
                fill="#0d1117"
                stroke={analysis.color}
                strokeWidth={2}
              />
            );
          }
          if (anomalyDates.has(combined[i].date)) {
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={4}
                fill="#fbbf24"
                stroke="#0d1117"
                strokeWidth={1.5}
              />
            );
          }
          return null;
        })}
      </svg>

      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
        <span>{combined[0]?.date}</span>
        <span>
          {hasLive
            ? `${combined[combined.length - 1]?.date} (진행 중)`
            : combined[combined.length - 1]?.date}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-3 text-center">
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
      </div>
    </div>
  );
}

export function ViewerConcentrationSection({
  viewerPercentile,
  countPercentile,
  viewerRank,
  countRank,
  viewerTieCount,
  countTieCount,
  totalGames,
  totalCountAll,
  viewerShare,
  countShare,
  trendRows,
  currentViewers,
  todayLabel,
  currentCount,
}: Props) {
  const quadrant = classify(currentViewers ?? 0, currentCount);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">시청자 집중도</CardTitle>
        <CardDescription className="text-xs">
          전체 게임 대비 순위와 최근 추이
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 pb-4 md:grid-cols-[minmax(0,350px)_1fr]">
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
        </div>

        <div className="flex items-center border-t pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          {trendRows && trendRows.length >= 3 ? (
            <div className="w-full">
              <TrendArea
                rows={trendRows}
                liveViewers={currentViewers}
                liveLabel={todayLabel}
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
