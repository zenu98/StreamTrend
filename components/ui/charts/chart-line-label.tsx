"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
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

const chartConfig = {
  value: { label: "값", color: "var(--chart-1)" },
} satisfies ChartConfig;

type Props = {
  title: string;
  description: string;
  data: { date: string; totalViewers: number; broadcastCount: number }[];
  dataKey: "totalViewers" | "broadcastCount";
};

export function ChartLineLabel({ title, description, data, dataKey }: Props) {
  const chartData = data.map((d) => ({ date: d.date, value: d[dataKey] }));
  const valueLabel = dataKey === "totalViewers" ? "시청자" : "방송 수";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base md:text-lg">{title}</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 md:p-6">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            데이터 없음
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="w-full h-40 md:h-52">
            <LineChart
              data={chartData}
              margin={{ top: 20, left: 12, right: 12, bottom: 0 }}
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
              <YAxis hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(v) => v}
                    formatter={(value) => [
                      Number(value).toLocaleString(),
                      valueLabel,
                    ]}
                  />
                }
              />
              <Line
                dataKey="value"
                type="natural"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={{ fill: "var(--color-value)", r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
