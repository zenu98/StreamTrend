import { getGameCategories } from "@/lib/games";
import Image from "next/image";
import Link from "next/link";

export default async function GamesPage() {
  const games = await getGameCategories();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">게임 카테고리</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {games.map((game) => (
          <Link
            key={game.category}
            href={`/games/${encodeURIComponent(game.categoryId)}`}
            className="group flex flex-col rounded-lg overflow-hidden border bg-card hover:border-primary transition-colors"
          >
            <div className="relative aspect-[3/4] bg-muted">
              {game.posterImageUrl ? (
                <Image
                  src={game.posterImageUrl}
                  alt={game.category}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm p-2 text-center">
                  {game.category}
                </div>
              )}
            </div>
            <div className="p-2 space-y-1">
              <p className="text-sm font-medium line-clamp-1">
                {game.category}
              </p>
              <p className="text-xs text-muted-foreground">
                👁 {game.totalViewers.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                📺 {game.count}개 방송
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
