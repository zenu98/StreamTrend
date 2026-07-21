import Link from "next/link";
import Image from "next/image";
import { Clock, Calendar, Users } from "lucide-react";
import { formatDuration } from "@/lib/utils";

type Row = {
  date: string;
  liveCategory: string;
  liveCategoryValue: string;
  totalViewers: number;
  broadcastCount: number;
  avgViewers: number;
  maxViewers: number;
  posterImageUrl?: string | null;
};

type GameStat = {
  categoryId: string;
  category: string;
  broadcastCount: number;
  totalViewers: number;
  maxViewers: number;
  dayCount: number;
  avgViewers: number;
  posterImageUrl?: string | null;
};

function getMainGames(rows: Row[]): GameStat[] {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const to = new Date(kstNow);
  to.setDate(to.getDate() - 1);
  const from = new Date(kstNow);
  from.setDate(from.getDate() - 7);

  const toStr = to.toISOString().slice(0, 10);
  const fromStr = from.toISOString().slice(0, 10);

  const filtered = rows.filter((r) => r.date >= fromStr && r.date <= toStr);

  const map = new Map<string, GameStat>();
  for (const r of filtered) {
    const prev = map.get(r.liveCategory);
    if (prev) {
      prev.broadcastCount += r.broadcastCount;
      prev.totalViewers += r.totalViewers;
      prev.maxViewers = Math.max(prev.maxViewers, r.maxViewers);
      prev.dayCount += 1;
    } else {
      map.set(r.liveCategory, {
        categoryId: r.liveCategory,
        category: r.liveCategoryValue,
        broadcastCount: r.broadcastCount,
        totalViewers: r.totalViewers,
        maxViewers: r.maxViewers,
        dayCount: 1,
        avgViewers: r.avgViewers,
        posterImageUrl: r.posterImageUrl ?? null,
      });
    }
  }

  return Array.from(map.values())
    .map((g) => ({
      ...g,
      avgViewers:
        g.broadcastCount > 0
          ? Math.round(g.totalViewers / g.broadcastCount)
          : 0,
    }))
    .sort((a, b) => b.broadcastCount - a.broadcastCount)
    .slice(0, 3);
}

export function StreamerMainGame({ rows }: { rows: Row[] }) {
  const games = getMainGames(rows);
  if (games.length === 0) return null;

  const totalBroadcastCount = games.reduce((s, g) => s + g.broadcastCount, 0);
  const [first, ...rest] = games;
  const firstPct =
    totalBroadcastCount > 0
      ? Math.round((first.broadcastCount / totalBroadcastCount) * 100)
      : 0;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">최근 7일 주력 게임</p>

      {/* 1위 */}
      <Link
        href={`/games/${encodeURIComponent(first.categoryId)}`}
        className="block rounded-xl border bg-card px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex gap-3 items-center">
          <div className="w-20 aspect-[3/4] rounded-lg bg-muted flex-shrink-0 overflow-hidden relative border">
            {first.posterImageUrl ? (
              <Image
                src={first.posterImageUrl}
                alt={first.category}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-1">
                {first.category[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                주력
              </span>
            </div>
            <p className="font-medium truncate">{first.category}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDuration(first.broadcastCount)}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {first.dayCount}일 방송
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                평균 {first.avgViewers.toLocaleString()}명
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${firstPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              방송 시간 비중 {firstPct}%
            </p>
          </div>
        </div>
      </Link>

      {/* 2·3위 */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {rest.map((game, i) => {
            const pct =
              totalBroadcastCount > 0
                ? Math.round((game.broadcastCount / totalBroadcastCount) * 100)
                : 0;
            return (
              <Link
                key={game.categoryId}
                href={`/games/${encodeURIComponent(game.categoryId)}`}
                className="rounded-xl border bg-card px-3 py-2.5 hover:bg-muted/50 transition-colors"
              >
                <div className="flex min-h-[90px] gap-2.5 items-center">
                  <div className="w-16 aspect-[3/4] rounded-lg bg-muted flex-shrink-0 overflow-hidden relative border">
                    {game.posterImageUrl ? (
                      <Image
                        src={game.posterImageUrl}
                        alt={game.category}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        {game.category[0]}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium truncate">
                      {game.category}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                      <Users className="h-3 w-3 shrink-0" />
                      평균 {game.avgViewers.toLocaleString()}명
                    </p>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-muted-foreground/40 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <Clock className="h-3 w-3 shrink-0 " />
                        <span className="translate-y-0.5">
                          {formatDuration(game.broadcastCount)}
                        </span>
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span className="translate-y-0.5">
                          {game.dayCount}일 방송
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
