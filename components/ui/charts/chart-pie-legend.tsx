"use client";

import { Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { ChartProps } from "@/types/chart";
import { buildChartConfig, buildChartData } from "@/lib/chart";

export function CategoryPieChart({
  title,
  description,
  data,
  dataKey,
}: ChartProps) {
  const chartData = buildChartData(data, dataKey);
  const chartConfig = buildChartConfig(data);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-100"
        >
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="category"
              label={({ percent }) => `${((percent ?? 0) * 100).toFixed(1)}%`}
              labelLine={true}
            />
            <ChartLegend
              content={<ChartLegendContent nameKey="category" />}
              className="-translate-y-2 flex-wrap gap-2 *:basis-1/5 *:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
