"use client";

import { PolarRadiusAxis, RadialBar, RadialBarChart, Label } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

const gradients: Record<string, { from: string; to: string }> = {
  high: { from: "#f59e0b", to: "#1bb373" },
  mid: { from: "#e24b4a", to: "#f59e0b" },
  low: { from: "#e24b4a", to: "#f97316" },
};

type Props = {
  title: string;
  value: number;
  subtitle?: string;
};

export function ChartRadialText({ title, value, subtitle }: Props) {
  const gradientKey = value >= 7 ? "high" : value >= 4 ? "mid" : "low";
  const gradient = gradients[gradientKey];
  const gradientId = `radialGradient-${gradientKey}`;

  const chartConfig = {
    value: { label: title },
  } satisfies ChartConfig;

  const chartData = [{ value: value / 100, fill: `url(#${gradientId})` }];

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square w-32 h-32"
    >
      <RadialBarChart
        data={chartData}
        startAngle={130}
        endAngle={-230}
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
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy + 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                  >
                    <tspan
                      className="text-4xl"
                      fill="white"
                      style={{ fontFamily: "var(--font-anton)" }}
                    >
                      {value}
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  );
}
