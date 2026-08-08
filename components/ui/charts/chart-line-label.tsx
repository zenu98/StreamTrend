"use client";

import Image from "next/image";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { TimeSeriesChartProps } from "@/types/chart";

type TopStreamer = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  maxViewers: number;
};

const chartConfig = {
  value: { label: "값", color: "var(--chart-1)" },
} satisfies ChartConfig;

function CustomTooltip({
  active,
  payload,
  label,
  topStreamersByDate,
  valueLabel,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  topStreamersByDate?: Record<string, TopStreamer[]>;
  valueLabel: string;
}) {
  if (!active || !payload?.length || !label) return null;
  const value = payload[0]?.value as number;
  const streamers = topStreamersByDate?.[label] ?? [];

  return (
    <div className="rounded-lg border border-white/10 bg-black/80 backdrop-blur-sm px-3 py-2 text-xs space-y-1.5">
      <p className="text-white/50">{label}</p>
      <p className="text-white font-semibold text-sm">
        {Number(value).toLocaleString()}
        {valueLabel}
      </p>
      {streamers.length > 0 && (
        <div className="flex gap-1 pt-0.5">
          {streamers.map((s) => (
            <div key={s.channelId}>
              {s.channelImageUrl ? (
                <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
                  <Image
                    src={s.channelImageUrl}
                    alt={s.channelName}
                    width={24}
                    height={24}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-white/50">
                  {s.channelName[0]}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type Props = TimeSeriesChartProps & {
  topStreamersByDate?: Record<string, TopStreamer[]>;
  hasLiveData?: boolean;
};

export function ChartLineLabel({
  title,
  description,
  data,
  dataKey,
  topStreamersByDate,
  hasLiveData,
}: Props) {
  const chartData = data.map((d, i) => {
    const isLast = hasLiveData && i === data.length - 1;
    const isSecondLast = hasLiveData && i === data.length - 2;
    return {
      date: d.date,
      value: isLast ? undefined : d[dataKey],
      valueLive: isSecondLast || isLast ? d[dataKey] : undefined,
    };
  });
  const valueLabel =
    dataKey === "totalViewers"
      ? "시청자"
      : dataKey === "broadcastCount"
        ? " 개"
        : " 명";
  const confirmedData = hasLiveData ? chartData.slice(0, -1) : chartData;
  const livePoint = hasLiveData ? chartData.slice(-2) : []; // 마지막 확정 + 오늘
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base md:text-lg">{title}</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            데이터 없음
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="w-full h-40 md:h-64">
            <LineChart
              data={chartData}
              margin={{ top: 20, left: 14, right: 12, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                width={40}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                cursor={false}
                content={
                  <CustomTooltip
                    topStreamersByDate={topStreamersByDate}
                    valueLabel={valueLabel}
                  />
                }
              />
              <Line
                dataKey="value"
                type="monotone"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
              {/* 점선 — 마지막 확정 포인트부터 오늘까지 */}
              {hasLiveData && (
                <Line
                  dataKey="valueLive"
                  type="monotone"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              )}
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
