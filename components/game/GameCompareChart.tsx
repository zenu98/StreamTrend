"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
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
import { useDebounce } from "@/hooks/useDebounce";

type Metric = "concurrentViewers" | "maxViewers" | "peakViewers";

type Row = {
  date: string;
  totalViewers: number;
  concurrentViewers: number;
  broadcastCount: number;
  maxViewers: number;
  peakViewers: number;
};

type GameData = {
  game: string;
  categoryId: string;
  data: Row[];
};

type Category = {
  categoryId: string;
  categoryValue: string;
};

type Props = {
  defaultGame: string;
  defaultCategoryId: string;
  defaultRows: Row[];
  allCategories: Category[];
  selected: string[];
  onSelectedChange: (selected: string[]) => void;
  dateRange: DateRange | undefined;
  metric: Metric;
};

export function GameCompareChart({
  defaultGame,
  defaultCategoryId,
  defaultRows,
  allCategories,
  selected,
  onSelectedChange,
  dateRange,
  metric,
}: Props) {
  const [search, setSearch] = useState("");
  const [extraGames, setExtraGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  // 카테고리 검색 (클라이언트 필터링)
  const searchResults = useMemo(() => {
    if (!debouncedSearch.trim()) return [];
    const query = debouncedSearch.toLowerCase().replace(/\s/g, "");
    return allCategories
      .filter((c) =>
        c.categoryValue.toLowerCase().replace(/\s/g, "").includes(query),
      )
      .slice(0, 20);
  }, [allCategories, debouncedSearch]);

  // 추가 게임 선택 시 API 호출
  async function addGame(categoryId: string, game: string) {
    if (selected.includes(game)) return;
    if (!dateRange?.from || !dateRange?.to) return;

    const from = format(dateRange.from, "yyyy-MM-dd");
    const to = format(dateRange.to, "yyyy-MM-dd");

    setLoading(true);
    const res = await fetch(
      `/api/compare-stats?games=${encodeURIComponent(categoryId)}&from=${from}&to=${to}`,
    );
    const data = await res.json();
    setLoading(false);

    const found = data.games?.find((d: any) => d.categoryId === categoryId);
    if (found) {
      setExtraGames((prev) => [
        ...prev,
        { game, categoryId, data: found.data },
      ]);
    }
    onSelectedChange([...selected, game]);
    setSearch("");
  }

  // 날짜 변경 시 추가 게임 데이터 갱신
  useEffect(() => {
    if (!extraGames.length || !dateRange?.from || !dateRange?.to) return;

    const from = format(dateRange.from, "yyyy-MM-dd");
    const to = format(dateRange.to, "yyyy-MM-dd");
    const categoryIds = extraGames.map((g) => g.categoryId).join(",");

    fetch(
      `/api/compare-stats?games=${encodeURIComponent(categoryIds)}&from=${from}&to=${to}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setExtraGames((prev) =>
          prev.map((g) => {
            const found = data.games?.find(
              (d: any) => d.categoryId === g.categoryId,
            );
            return found ? { ...g, data: found.data } : g;
          }),
        );
      });
  }, [dateRange]);

  // 기본 게임 날짜 필터링
  const filteredDefaultRows = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return defaultRows;
    const from = format(dateRange.from, "MM-dd");
    const to = format(dateRange.to, "MM-dd");
    return defaultRows.filter((r) => r.date >= from && r.date <= to);
  }, [defaultRows, dateRange]);

  // 전체 날짜 목록
  const allDates = useMemo(() => {
    const dates = new Set(filteredDefaultRows.map((r) => r.date));
    extraGames.forEach((g) => g.data.forEach((d) => dates.add(d.date)));
    return [...dates].sort();
  }, [filteredDefaultRows, extraGames]);

  // 차트 데이터
  const chartData = useMemo(() => {
    return allDates.map((date) => {
      const row: Record<string, string | number> = { date };
      const defaultDay = filteredDefaultRows.find((r) => r.date === date);
      row[defaultGame] = defaultDay?.[metric] ?? 0;

      for (const g of extraGames) {
        if (!selected.includes(g.game)) continue;
        const day = g.data.find((d) => d.date === date);
        row[g.game] = day?.[metric] ?? 0;
      }
      return row;
    });
  }, [
    allDates,
    filteredDefaultRows,
    extraGames,
    selected,
    metric,
    defaultGame,
  ]);

  const chartConfig = useMemo(() => {
    return selected.reduce((acc, game, i) => {
      acc[game] = { label: game, color: COLORS[i % COLORS.length] };
      return acc;
    }, {} as ChartConfig);
  }, [selected]);

  function removeGame(game: string) {
    if (game === defaultGame) return;
    onSelectedChange(selected.filter((g) => g !== game));
    setExtraGames((prev) => prev.filter((g) => g.game !== game));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>게임별 시청자 추이 비교</CardTitle>
        <CardDescription>게임을 검색해서 추가해보세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
            로딩 중...
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="w-full h-64">
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 12, right: 12, top: 20 }}
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
              <YAxis
                width={40}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    formatter={(value, name) => [
                      String(name),
                      `: ${Number(value).toLocaleString()}명`,
                    ]}
                  />
                }
              />
              {selected.map((game, i) => (
                <Area
                  key={game}
                  dataKey={game}
                  type="monotone"
                  fill={COLORS[i % COLORS.length]}
                  fillOpacity={0.2}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  // dot={{ fill: COLORS[i % COLORS.length], r: 3 }}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              ))}
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}

        <Input
          placeholder="비교할 게임 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        {debouncedSearch.trim() && searchResults.length > 0 && (
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
            {searchResults.map((g) => (
              <button
                key={g.categoryId}
                onClick={() => addGame(g.categoryId, g.categoryValue)}
                className="px-2 py-1 rounded-full text-xs border transition-colors bg-background text-muted-foreground border-border hover:border-primary"
              >
                {g.categoryValue}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {selected.map((game, i) => (
            <button
              key={game}
              onClick={() => removeGame(game)}
              className="px-2 py-1 rounded-full text-xs text-white flex items-center gap-1"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            >
              {game} {game !== defaultGame && "✕"}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
