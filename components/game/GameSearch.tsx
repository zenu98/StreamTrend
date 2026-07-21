"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";

type Game = {
  category: string;
  categoryId: string;
  posterImageUrl: string | null;
  totalViewers: number;
  count: number;
};

export function GameSearch({ games }: { games: Game[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return games;
    return games.filter((g) => g.category.toLowerCase().includes(q));
  }, [games, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="게임 이름 검색"
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-9 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-white/40">
          &ldquo;{query}&rdquo;에 해당하는 게임이 없어요
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((game) => (
            <Link
              key={game.category}
              href={`/games/${encodeURIComponent(game.categoryId)}`}
              className="group flex flex-col rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
            >
              {/* 기존 카드 마크업 그대로 이동 */}
              <div className="relative aspect-[3/4] bg-white/5 rounded-lg overflow-hidden">
                {game.posterImageUrl ? (
                  <Image
                    src={game.posterImageUrl}
                    alt={game.category}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm p-2 text-center">
                    {game.category}
                  </div>
                )}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/80 rounded-full px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <div className="text-white text-xs font-bold">
                    {game.totalViewers >= 10000
                      ? `${(game.totalViewers / 10000).toFixed(1)}만명`
                      : game.totalViewers.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="pt-2 space-y-0.5">
                <p className="text-sm font-medium line-clamp-1 text-white">
                  {game.category}
                </p>
                <p className="text-xs text-white/40">라이브 {game.count}개</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
