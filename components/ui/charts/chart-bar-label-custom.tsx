"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
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
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartProps } from "@/types/chart";
import { buildChartConfig, buildChartData } from "@/lib/chart";

export function ChartBarLabelCustom({
  title,
  description,
  data,
  dataKey,
}: ChartProps) {
  const chartData = buildChartData(data, dataKey);
  const chartConfig: ChartConfig = {
    ...buildChartConfig(data),
    label: { color: "var(--background)" },
    value: { label: dataKey === "totalViewers" ? "시청자" : "방송수" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ right: 60 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              axisLine={false}
              hide
            />
            <XAxis dataKey="value" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar dataKey="value" radius={4}>
              <LabelList
                dataKey="category"
                position="insideLeft"
                offset={8}
                className="fill-(--color-label)"
                fontSize={12}
                formatter={(value: unknown) =>
                  typeof value === "string" && value.length > 8
                    ? value.slice(0, 8) + "…"
                    : String(value ?? "")
                }
              />
              <LabelList
                dataKey="value"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: unknown) =>
                  typeof value === "number"
                    ? value.toLocaleString()
                    : String(value ?? "")
                }
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
