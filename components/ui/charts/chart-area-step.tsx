"use client";

import { useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";

type DotArgs = { cx: number; cy: number; index: number };

export type StepAreaSeries<T> = {
  /** 이 시리즈가 값을 읽어올 데이터 키 */
  key: Extract<keyof T, string>;
  color?: string;
  /** 점선 스트로크, 예: "4 3" ("진행 중" 구간 등에 사용) */
  strokeDasharray?: string;
  /** 이 시리즈 아래를 그라데이션으로 채울지 여부 */
  fill?: boolean;
  /** 포인트별 커스텀 점 렌더러. null 반환 시 점 없음 */
  renderDot?: (args: DotArgs, payload: T) => React.ReactNode;
};

type ChartAreaStepProps<T extends Record<string, unknown>> = {
  data: T[];
  xKey: Extract<keyof T, string>;
  series: StepAreaSeries<T>[];
  height?: number;
  renderTooltip?: (payload: T) => React.ReactNode;
  className?: string;
};

export function ChartAreaStep<T extends Record<string, unknown>>({
  data,
  xKey,
  series,
  height = 160,
  renderTooltip,
  className,
}: ChartAreaStepProps<T>) {
  const uid = useId();

  const chartConfig = series.reduce((config, s) => {
    config[s.key] = { label: s.key, color: s.color ?? "var(--chart-1)" };
    return config;
  }, {} as ChartConfig);

  // 같은 색을 쓰는 시리즈끼리 그라데이션을 공유해서
  // (예: historical + live) 경계에서 채움이 끊기지 않고 이어지도록 함
  const gradientColors = Array.from(
    new Set(
      series.filter((s) => s.fill).map((s) => s.color ?? "var(--chart-1)"),
    ),
  );

  const allValues = data.flatMap((d) =>
    series.map((s) => d[s.key]).filter((v) => typeof v === "number"),
  ) as number[];
  const dataMin = allValues.length ? Math.min(...allValues) : 0;
  const dataMax = allValues.length ? Math.max(...allValues) : 0;
  return (
    <ChartContainer
      config={chartConfig}
      className={`!aspect-auto [&_.recharts-wrapper]:outline-none ${className ?? ""}`}
      style={{ height }}
    >
      <AreaChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
        <defs>
          {gradientColors.map((color, i) => (
            <linearGradient
              key={i}
              id={`stepFill-${uid}-${i}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        <CartesianGrid vertical={false} strokeOpacity={0.15} />
        <XAxis dataKey={xKey} tick={false} axisLine={false} tickLine={false} />

        {/* ↓ 여기 추가 (XAxis 바로 다음) */}
        <YAxis
          hide
          domain={[dataMin, dataMax]}
          padding={{ top: 8, bottom: 8 }}
          allowDataOverflow={false}
        />

        {renderTooltip && (
          <ChartTooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return renderTooltip(payload[0].payload as T);
            }}
          />
        )}

        {series.map((s) => {
          const color = s.color ?? "var(--chart-1)";
          const gradIdx = gradientColors.indexOf(color);
          return (
            <Area
              key={s.key}
              dataKey={s.key}
              type="linear"
              stroke={color}
              strokeWidth={2}
              strokeDasharray={s.strokeDasharray}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={s.fill ? `url(#stepFill-${uid}-${gradIdx})` : "transparent"}
              connectNulls={false}
              isAnimationActive={false}
              activeDot={false}
              dot={
                s.renderDot
                  ? (props: any) => {
                      const { cx, cy, index, payload } = props;
                      if (cx == null || cy == null || !payload) {
                        return <g key={`dot-${s.key}-${index}`} />;
                      }
                      return (
                        s.renderDot!({ cx, cy, index }, payload as T) ?? (
                          <g key={`dot-${s.key}-${index}`} />
                        )
                      );
                    }
                  : false
              }
            />
          );
        })}
      </AreaChart>
    </ChartContainer>
  );
}
