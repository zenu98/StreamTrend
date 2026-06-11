"use client";

import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartProps } from "@/types/chart";
import { COLORS } from "@/lib/chart";

function CustomContent({
  x,
  y,
  width,
  height,
  name,
  value,
  index,
  posterImageUrl,
}: any) {
  if (width < 30 || height < 30) return null;
  const clipId = `clip-${index}`;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} rx={4} />
        </clipPath>
      </defs>

      {/* 배경 색상 */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: COLORS[index % COLORS.length],
          stroke: "#fff",
          strokeWidth: 2,
        }}
        rx={4}
      />

      {/* 포스터 이미지 */}
      {posterImageUrl && (
        <image
          x={x}
          y={y}
          width={width}
          height={height}
          href={posterImageUrl}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
          style={{ opacity: 0.4 }}
        />
      )}

      {/* 어두운 오버레이 */}
      {posterImageUrl && (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="rgba(0,0,0,0.3)"
          clipPath={`url(#${clipId})`}
          rx={4}
        />
      )}

      {/* 게임명 */}
      {width > 60 && height > 40 && (
        <text
          x={x + width / 2}
          y={y + height / 2 - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.min(12, width / 8)}
          fill="#fff"
          fontWeight="bold"
        >
          {name.length > 8 ? name.slice(0, 8) + "…" : name}
        </text>
      )}

      {/* 수치 */}
      {width > 60 && height > 55 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.min(11, width / 9)}
          fill="rgba(255,255,255,0.85)"
        >
          {Number(value).toLocaleString()}
        </text>
      )}
    </g>
  );
}

export function ChartTreemap({
  title,
  description,
  data,
  dataKey,
}: ChartProps) {
  const chartData = data.map((d) => ({
    name: d.category,
    size: d[dataKey as keyof typeof d] as number,
    posterImageUrl: d.posterImageUrl,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <Treemap
            data={chartData}
            dataKey="size"
            content={(props: any) => {
              const item = chartData.find((d) => d.name === props.name);
              return (
                <CustomContent
                  {...props}
                  posterImageUrl={item?.posterImageUrl}
                />
              );
            }}
          >
            <Tooltip
              formatter={(value: unknown) =>
                typeof value === "number"
                  ? value.toLocaleString()
                  : String(value)
              }
            />
          </Treemap>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
