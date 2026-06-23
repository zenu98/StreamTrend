"use client";

import { useState, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { COLORS } from "@/lib/chart";

type GameData = {
  game: string;
  data: { date: string; value: number }[];
};

type PeriodData = {
  dates: string[];
  games: GameData[];
};

type Props = {
  weekly: PeriodData;
  monthly: PeriodData;
  defaultGames?: string[];
};

export function GameCompareChart({ weekly, monthly, defaultGames }: Props) {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>(
    () => defaultGames ?? weekly.games.slice(0, 3).map((g) => g.game),
  );

  const current = period === "weekly" ? weekly : monthly;

  const filtered = useMemo(
    () =>
      current.games.filter((g) =>
        g.game.toLowerCase().includes(search.toLowerCase()),
      ),
    [current.games, search],
  );

  const chartData = useMemo(() => {
    return current.dates.map((date) => {
      const row: Record<string, string | number> = { date };
      for (const game of selected) {
        const gameData = current.games.find((g) => g.game === game);
        row[game] = gameData?.data.find((d) => d.date === date)?.value ?? 0;
      }
      return row;
    });
  }, [current, selected]);

  const chartConfig = useMemo(() => {
    return selected.reduce((acc, game, i) => {
      acc[game] = {
        label: game,
        color: COLORS[i % COLORS.length],
      };
      return acc;
    }, {} as ChartConfig);
  }, [selected]);

  function toggleGame(game: string) {
    setSelected((prev) =>
      prev.includes(game) ? prev.filter((g) => g !== game) : [...prev, game],
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>게임별 시청자 추이 비교</CardTitle>
        <CardDescription>게임을 선택해서 비교해보세요</CardDescription>
        <div className="flex gap-2 mt-2">
          <button
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              period === "weekly"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border"
            }`}
            onClick={() => setPeriod("weekly")}
          >
            7일
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              period === "monthly"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border"
            }`}
            onClick={() => setPeriod("monthly")}
          >
            30일
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChartContainer config={chartConfig} className="w-full h-80">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12, top: 30 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value, name) => [
                    String(name),
                    ` : ${Number(value).toLocaleString()}명`,
                  ]}
                />
              }
            />
            {selected.map((game, i) => (
              <Area
                key={game}
                dataKey={game}
                type="natural"
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.2}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ fill: COLORS[i % COLORS.length], r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>

        {/* 게임 검색 */}
        <Input
          placeholder="게임 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        {/* 검색 결과 */}
        {search.trim() && (
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
            {filtered.slice(0, 20).map((g) => (
              <button
                key={g.game}
                onClick={() => {
                  toggleGame(g.game);
                  setSearch("");
                }}
                className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                  selected.includes(g.game)
                    ? "text-white border-transparent"
                    : "bg-background text-muted-foreground border-border"
                }`}
                style={
                  selected.includes(g.game)
                    ? {
                        backgroundColor:
                          COLORS[selected.indexOf(g.game) % COLORS.length],
                      }
                    : {}
                }
              >
                {g.game}
              </button>
            ))}
          </div>
        )}

        {/* 선택된 게임 태그 */}
        <div className="flex flex-wrap gap-2">
          {selected.map((game) => (
            <button
              key={game}
              onClick={() => toggleGame(game)}
              className="px-2 py-1 rounded-full text-xs text-white flex items-center gap-1"
              style={{
                backgroundColor: COLORS[selected.indexOf(game) % COLORS.length],
              }}
            >
              {game} ✕
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
