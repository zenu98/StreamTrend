"use client";
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

export function ChartBarMixed<T extends BaseCategoryData>({
  title,
  description,
  data,
  dataKey,
  valueLabel = "value",
}: Props<T>) {
  const chartData = buildChartData(data, dataKey as keyof BaseCategoryData);
  const chartConfig = {
    ...buildChartConfig(data),
    value: { label: valueLabel },
  };
  const yAxisWidth =
    Math.max(
      ...data.map((d) => {
        const label =
          (chartConfig[d.category as keyof typeof chartConfig]
            ?.label as string) ?? "";
        return Math.max(...label.split("\n").map((line) => line.length));
      }),
    ) * 10;

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
          style={{ height: `${data.length * 45}px` }}
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ left: 0 }}
          >
            <YAxis
              dataKey="category"
              width={yAxisWidth}
              type="category"
              tickLine={false}
              tickMargin={0}
              axisLine={false}
              tick={({ y, payload }) => (
                <text
                  x={0}
                  y={y}
                  textAnchor="start"
                  dominantBaseline="middle"
                  fontSize={12}
                  fill="#666"
                >
                  {
                    chartConfig[payload.value as keyof typeof chartConfig]
                      ?.label as string
                  }
                </text>
              )}
            />
            <XAxis dataKey="value" type="number" />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="value" radius={5}>
              <LabelList
                dataKey="value"
                content={({ x, y, width, height, value }) => {
                  const numValue = typeof value === "number" ? value : 0;
                  const text = numValue.toLocaleString();
                  const textWidth = text.length * 7; // 글자당 약 7px
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
