import Image from "next/image";
import Link from "next/link";

type Streamer = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  totalViewers: number;
};

type Game = {
  category: string;
  categoryId: string;
  concurrentViewers: number;
  posterImageUrl: string | null;
  topStreamers: Streamer[];
};

type Props = {
  games: Game[];
};

export function TrendingGame({ games }: Props) {
  const top3 = games.slice(0, 3);
  const rest = games.slice(3, 10);

  const podiumOrder = [top3[1], top3[0], top3[2]]; // 2, 1, 3 순서

  return (
    <div className="space-y-6">
      {/* 포디움 */}
      <div className="flex justify-center items-start gap-6">
        {podiumOrder.map((game, idx) => {
          const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
          const isFirst = rank === 1;
          const borderColor =
            rank === 1 ? "#f59e0b" : rank === 2 ? "#9ca3af" : "#b45309";
          const badgeBg =
            rank === 1 ? "#fef3c7" : rank === 2 ? "#f3f4f6" : "#fef3c7";
          const badgeBorder =
            rank === 1 ? "#f59e0b" : rank === 2 ? "#9ca3af" : "#b45309";
          const badgeColor =
            rank === 1 ? "#92400e" : rank === 2 ? "#374151" : "#78350f";
          const size = isFirst ? "w-20 h-20" : "w-16 h-16";

          return (
            <Link
              key={game.categoryId}
              href={`/games/${encodeURIComponent(game.categoryId)}`}
              className={`flex flex-col items-center gap-2 ${!isFirst ? "mt-10" : ""}`}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: badgeBg,
                  border: `0.5px solid ${badgeBorder}`,
                  color: badgeColor,
                }}
              >
                {rank}
              </div>
              <div
                className={`${size} rounded-full overflow-hidden relative flex-shrink-0`}
                style={{ border: `3px solid ${borderColor}` }}
              >
                {game.posterImageUrl ? (
                  <Image
                    src={game.posterImageUrl}
                    alt={game.category}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
              <p className="text-sm font-medium text-center max-w-[90px] truncate">
                {game.category}
              </p>
              <p className="text-xs text-muted-foreground">
                {game.concurrentViewers.toLocaleString()}명
              </p>
            </Link>
          );
        })}
      </div>

      {/* 4~10위 리스트 */}
      <div>
        {rest.map((game, idx) => (
          <div
            key={game.categoryId}
            className="flex items-center gap-3 py-3 border-b last:border-0"
          >
            <span className="w-5 text-sm font-medium text-muted-foreground text-center">
              {idx + 4}
            </span>
            <Link
              href={`/games/${encodeURIComponent(game.categoryId)}`}
              className="relative w-10 h-14 rounded-md overflow-hidden flex-shrink-0"
            >
              {game.posterImageUrl ? (
                <Image
                  src={game.posterImageUrl}
                  alt={game.category}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="w-full h-full bg-muted" />
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/games/${encodeURIComponent(game.categoryId)}`}>
                <p className="text-sm font-medium truncate">{game.category}</p>
              </Link>
              <p className="text-xs text-muted-foreground">
                평균 {game.concurrentViewers.toLocaleString()}명
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {game.topStreamers.map((streamer) => (
                <Link
                  key={streamer.channelId}
                  href={`/streamers/${streamer.channelId}`}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden relative border">
                    {streamer.channelImageUrl ? (
                      <Image
                        src={streamer.channelImageUrl}
                        alt={streamer.channelName}
                        fill
                        className="object-cover"
                        sizes="28px"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-xs">
                        {streamer.channelName[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground max-w-[36px] truncate">
                    {streamer.channelName}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
