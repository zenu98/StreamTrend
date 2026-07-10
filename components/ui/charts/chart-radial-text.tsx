"use client";

import { PolarRadiusAxis, RadialBar, RadialBarChart, Label } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

const gradients: Record<string, { from: string; to: string; text: string }> = {
  S: { from: "#A855F7", to: "#EC4899", text: "#391a70" },
  A: { from: "#F97316", to: "#EF4444", text: "#C2410C" },
  B: { from: "#3B82F6", to: "#06B6D4", text: "#1D4ED8" },
  C: { from: "#94A3B8", to: "#CBD5E1", text: "#64748B" },
  default: { from: "#6366F1", to: "#8B5CF6", text: "#4338CA" },
};

type Props = {
  title: string;
  value: number;
  label?: string;
  tier?: string;
  subtitle?: string;
};

export function ChartRadialText({
  title,
  value,
  label,
  tier = "default",
  subtitle,
}: Props) {
  const gradient = gradients[tier] ?? gradients.default;
  const gradientId = `radialGradient-${tier}`;

  const chartConfig = {
    value: { label: title },
  } satisfies ChartConfig;

  const chartData = [{ value: 1, fill: `url(#${gradientId})` }];

  return (
    <Card>
      <CardHeader className="items-center gap-1 pb-0">
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-50"
        >
          <RadialBarChart
            data={chartData}
            startAngle={0}
            endAngle={360}
            outerRadius="100%"
            innerRadius="80%"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={gradient.from} />
                <stop offset="100%" stopColor={gradient.to} />
              </linearGradient>
            </defs>
            <RadialBar dataKey="value" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const radius =
                      "outerRadius" in viewBox ? viewBox.outerRadius : 90;
                    const fontSize = Math.max(16, Math.round(radius * 0.42));
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        className="translate-y-1"
                      >
                        <tspan fontSize={fontSize} fontWeight="bold">
                          {value.toLocaleString()}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
