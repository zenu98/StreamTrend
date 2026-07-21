import { getGameCategories } from "@/lib/games";
import Image from "next/image";
import Link from "next/link";
import { Info } from "lucide-react";
import { Suspense } from "react";
import { GameSearch } from "@/components/game/GameSearch";

export default function GamesPage() {
  return <GamesContent />;
}

async function GamesContent() {
  const games = await getGameCategories();

  return (
    <main className=" mx-auto space-y-6 p-8">
      <div className="w-full border border-white/10 rounded-lg p-4 bg-white/5 text-sm space-y-2">
        <div className="font-semibold flex items-center text-white/50 gap-1">
          <Info className="w-4 h-4" />
          <div>수치 안내</div>
        </div>
        <p className="text-white/40">
          동시시청자 순 상위 2,000개 방송 기준으로 5분마다 수집되므로, 하위
          방송은 집계에서 제외됩니다. 이로 인해 시청자 수와 방송 수가 치지직
          공식 수치와 오차가 있을 수 있습니다.
        </p>
      </div>
      <h1 className="text-2xl font-bold my-6">게임 카테고리</h1>

      <GameSearch games={games} />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {games.map((game) => (
          <Link
            key={game.category}
            href={`/games/${encodeURIComponent(game.categoryId)}`}
            className="group flex flex-col rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
          >
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
    </main>
  );
}
