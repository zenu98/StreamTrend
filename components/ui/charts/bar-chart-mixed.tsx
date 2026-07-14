"use client";
import { useMemo } from "react";
import { Bar, BarChart, XAxis, YAxis, LabelList } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BaseCategoryData } from "@/types/chart";
import { buildChartConfig, buildChartData } from "@/lib/chart";

type Props<T extends BaseCategoryData> = {
  title: string;
  description: string;
  data: T[];
  dataKey: keyof T;
  valueLabel?: string;
};

let measureCanvas: HTMLCanvasElement | null = null;

function measureTextWidth(text: string, font: string): number {
  if (typeof document === "undefined") {
    // 서버 렌더링 시점엔 canvas가 없어서 넉넉하게 추정 (클라이언트 하이드레이션 후 정확히 재계산됨)
    return text.length * 14;
  }
  if (!measureCanvas) measureCanvas = document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  if (!ctx) return text.length * 14;
  ctx.font = font;
  return ctx.measureText(text).width;
}

export function ChartBarMixed<T extends BaseCategoryData>({
  title,
  description,
  data,
  dataKey,
  valueLabel = "value",
}: Props<T>) {
  const BAR_SIZE = 30;
  const BAR_GAP = 16;
  const chartData = buildChartData(data, dataKey as keyof BaseCategoryData);
  const chartConfig = {
    ...buildChartConfig(data),
    value: { label: valueLabel },
  };

  const yAxisWidth = useMemo(() => {
    const font = "12px sans-serif";
    const widths = data.map((d) => measureTextWidth(String(d.category), font));
    return Math.max(...widths, 40) + 16; // 실측 최대값 + 여유 패딩
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="w-full"
          style={{
            height: `${64 + data.length * (BAR_SIZE + BAR_GAP)}px`,
          }}
        >
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, bottom: 8, left: 0 }}
          >
            <YAxis
              dataKey="category"
              width={yAxisWidth}
              type="category"
              tickLine={false}
              tickMargin={0}
              interval={0}
              axisLine={false}
              tick={({ y, payload }) => (
                <text
                  x={0}
                  y={y}
                  textAnchor="start"
                  dominantBaseline="middle"
                  fontSize={12}
                  fill="#fff"
                >
                  {payload.value}
                </text>
              )}
            />
            <XAxis dataKey="value" type="number" />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="value" radius={5} barSize={BAR_SIZE}>
              <LabelList
                dataKey="value"
                content={({ x, y, width, height, value }) => {
                  const numValue = typeof value === "number" ? value : 0;
                  const text = numValue.toLocaleString();
                  const textWidth = text.length * 7;
                  const insideRight = (width as number) > textWidth + 16;

                  return (
                    <text
                      x={
                        (x as number) +
                        (width as number) +
                        (insideRight ? -8 : 8)
                      }
                      y={(y as number) + (height as number) / 1.9}
                      textAnchor={insideRight ? "end" : "start"}
                      dominantBaseline="middle"
                      fontSize={12}
                      fill={insideRight ? "white" : "#767676"}
                    >
                      {text}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
