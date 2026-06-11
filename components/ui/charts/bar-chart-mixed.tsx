"use client";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
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
import { ChartProps } from "@/types/chart";
import { buildChartConfig, buildChartData } from "@/lib/chart";

export function ChartBarMixed({
  title,
  description,
  data,
  dataKey,
  valueLabel = "value",
}: ChartProps) {
  const chartData = buildChartData(data, dataKey);
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
              //   tickFormatter={(value) =>
              //     chartConfig[value as keyof typeof chartConfig]?.label as string
              //   }
            />

            <XAxis dataKey="value" type="number" />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="value" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
