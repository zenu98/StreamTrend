import { Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Streamer = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  totalViewers: number;
  maxViewers: number;
  broadcastCount: number;
  topGames: string[];
};

type Props = {
  streamers: Streamer[];
};

export function TrendingStreamer({ streamers }: Props) {
  return (
    <div className="space-y-0 mx-auto max-w-6xl">
      <div className="text-center mt-16 mb-8">
        <h1 className="text-6xl font-extrabold text-white">트렌딩 스트리머</h1>
        <div className="flex items-center justify-center gap-1 mt-2">
          <p className="text-sm text-white/40">최근 7일간 평균 시청자 기준</p>
          <div className="relative group">
            <Info className="w-4 h-4 text-white/30 cursor-help -translate-y-px" />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 rounded-lg bg-white/10 backdrop-blur-sm text-xs text-white/70 hidden group-hover:block z-10 text-left space-y-1.5">
              <p>· 오늘 데이터는 제외됩니다 (매일 06:00 집계)</p>
              <p>· 평균 시청자 = 누적 시청자 합산 ÷ 수집 횟수</p>
              <p>· 최고 시청자 = 방송 중 최고 동시시청자</p>
              <p>· 상위 2,000개 방송 기준으로 5분마다 수집됩니다</p>
            </div>
          </div>
        </div>
      </div>
      {streamers.map((streamer, idx) => {
        const rank = idx + 1;
        const isTop3 = rank <= 3;
        const rankColor =
          rank === 1
            ? "#f59e0b"
            : rank === 2
              ? "#9ca3af"
              : rank === 3
                ? "#b45309"
                : "rgba(255,255,255,0.3)";
        const rankSize = isTop3 ? "text-xl font-bold" : "text-sm font-medium";

        return (
          <Link
            key={streamer.channelId}
            href={`/streamers/${streamer.channelId}`}
            className="flex items-center gap-4 py-3 border-b border-white/10 hover:bg-white/5 transition-colors rounded-lg px-2"
          >
            {/* 순위 */}
            <span
              className={`w-6 text-center ${rankSize} flex-shrink-0`}
              style={{ color: rankColor }}
            >
              {rank}
            </span>

            {/* 프로필 이미지 */}
            <div
              className="w-11 h-11 rounded-full overflow-hidden relative flex-shrink-0"
              style={{
                border: isTop3
                  ? `2px solid ${rankColor}`
                  : "2px solid rgba(255,255,255,0.1)",
              }}
            >
              {streamer.channelImageUrl ? (
                <Image
                  src={streamer.channelImageUrl}
                  alt={streamer.channelName}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center text-white text-sm">
                  {streamer.channelName[0]}
                </div>
              )}
            </div>

            {/* 이름 + 게임 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {streamer.channelName}
              </p>
              <p className="text-xs text-white/40 mt-0.5 truncate">
                {streamer.topGames.join(" · ")}
              </p>
            </div>

            {/* 시청자 수 */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold text-white">
                {streamer.totalViewers > 0 && streamer.broadcastCount > 0
                  ? Math.round(
                      streamer.totalViewers / streamer.broadcastCount,
                    ).toLocaleString()
                  : 0}
                명
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                최고시청자 {streamer.maxViewers.toLocaleString()}명
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
