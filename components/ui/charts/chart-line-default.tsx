"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type TooltipContentProps = React.ComponentProps<typeof Tooltip>["content"];

type Props<T extends Record<string, unknown>> = {
  title: string;
  description?: string;
  data: T[];
  dataKey: keyof T;
  xAxisKey: keyof T;
  label?: string;
  footerNote?: string;
  renderTooltip?: TooltipContentProps;
};

export function ChartLineDefault<T extends Record<string, unknown>>({
  title,
  description,
  data,
  dataKey,
  xAxisKey,
  label = "값",
  footerNote,
  renderTooltip,
}: Props<T>) {
  const chartConfig = {
    [dataKey]: {
      label,
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  const first = data[0]?.[dataKey] as number | undefined;
  const last = data[data.length - 1]?.[dataKey] as number | undefined;
  const hasTrend = data.length >= 2 && first != null && last != null;
  const changePct =
    hasTrend && first! > 0 ? Math.round(((last! - first!) / first!) * 100) : 0;
  const isUp = changePct >= 0;
  console.log("trendRows length:", data.length, data);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            추이 데이터가 부족해요
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="h-[200px] w-full md:h-[280px]"
          >
            <LineChart
              accessibilityLayer
              data={data}
              margin={{ left: 14, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey={xAxisKey as string}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
                tickFormatter={(value: string) => {
                  const [month, day] = value.split("-");
                  return `${month}.${day}`;
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                width={40}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <ChartTooltip
                cursor={false}
                content={renderTooltip ?? <ChartTooltipContent hideLabel />}
              />
              <Line
                dataKey={dataKey as string}
                type="linear"
                stroke={`var(--color-${String(dataKey)})`}
                strokeWidth={2}
                dot={
                  data.length <= 1
                    ? { fill: `var(--color-${String(dataKey)})`, r: 4 }
                    : false
                }
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
      {/* {hasTrend && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 leading-none font-medium">
            {isUp ? "상승" : "하락"} 중이에요 ({isUp ? "+" : ""}
            {changePct}%)
            {isUp ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
          {footerNote && (
            <div className="leading-none text-muted-foreground">
              {footerNote}
            </div>
          )}
        </CardFooter>
      )} */}
    </Card>
  );
}
