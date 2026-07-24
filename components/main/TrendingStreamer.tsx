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

function avgViewers(s: Streamer) {
  return s.totalViewers > 0 && s.broadcastCount > 0
    ? Math.round(s.totalViewers / s.broadcastCount)
    : 0;
}

function BlurBg({ url }: { url: string | null }) {
  if (!url) return <div className="absolute inset-0 bg-white/10" />;
  return (
    <Image
      src={url}
      alt=""
      fill
      className="object-cover scale-110"
      sizes="100vw"
      style={{ filter: "blur(1px) brightness(0.35)" }}
    />
  );
}

function ProfileCircle({
  url,
  name,
  borderColor,
}: {
  url: string | null;
  name: string;
  borderColor?: string;
}) {
  return (
    <div
      className="w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden flex-shrink-0"
      style={{
        border: borderColor
          ? `2px solid ${borderColor}`
          : "2px solid rgba(255,255,255,0.2)",
      }}
    >
      {url ? (
        <Image
          src={url}
          alt={name}
          width={64}
          height={64}
          className="object-cover w-full h-full"
        />
      ) : (
        <div className="w-full h-full bg-white/10 flex items-center justify-center text-white text-sm">
          {name[0]}
        </div>
      )}
    </div>
  );
}

export function TrendingStreamer({ streamers }: Props) {
  const top3 = streamers.slice(0, 3);
  const rest = streamers.slice(3, 9);

  return (
    <section className="space-y-0 w-full px-4 md:px-0">
      <div className="text-center mt-8 md:mt-16 mb-4 md:mb-8">
        <h1 className="text-4xl mb-4 md:text-6xl font-extrabold text-white">
          트렌딩 스트리머
        </h1>
        <div className="flex items-center justify-center gap-1 mt-2">
          <p className="text-xs md:text-sm text-white/40">
            최근 7일간 평균 시청자 기준
          </p>
          <div className="relative group">
            <Info className="w-4 h-4 text-white/30 cursor-help -translate-y-px" />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 md:w-72 p-3 rounded-lg bg-white/10 backdrop-blur-sm text-xs text-white/70 hidden group-hover:block z-10 text-left space-y-1.5">
              <p>· 오늘 데이터는 제외됩니다 (매일 06:00 집계)</p>
              <p>· 평균 시청자 = 누적 시청자 합산 ÷ 수집 횟수</p>
              <p>· 최고 시청자 = 방송 중 최고 동시시청자</p>
              <p>· 게임/스포츠/토크 전체 카테고리 포함</p>
              <p>· 상위 2,000개 방송 기준으로 5분마다 수집됩니다</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {/* 1위 — 가로 배너 */}
        {top3[0] && (
          <Link
            href={`/streamers/${top3[0].channelId}`}
            className="relative flex h-28 md:h-48 overflow-hidden rounded-2xl border-2"
            style={{ borderColor: "#f59e0b" }}
          >
            <BlurBg url={top3[0].channelImageUrl} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center gap-3 px-3">
              <ProfileCircle
                url={top3[0].channelImageUrl}
                name={top3[0].channelName}
                borderColor="#f59e0b"
              />
              <div className="min-w-0 flex-1 items-center">
                <p className="text-white font-bold md:text-2xl truncate">
                  {top3[0].channelName}
                </p>
                <p className="text-white/60 text-xs md:text-sm truncate ">
                  {top3[0].topGames.join(" · ")}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p
                  className="text-white text-3xl md:text-6xl leading-none "
                  style={{ fontFamily: "var(--font-anton)" }}
                >
                  {avgViewers(top3[0]).toLocaleString()}
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* 2·3위 — 2열 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[top3[1], top3[2]].map((streamer, i) => {
            if (!streamer) return null;
            const rank = i + 2;
            const borderColor = rank === 2 ? "#9ca3af" : "#b45309";
            return (
              <Link
                key={streamer.channelId}
                href={`/streamers/${streamer.channelId}`}
                className="relative h-24 md:h-40 overflow-hidden rounded-xl border-2"
                style={{ borderColor }}
              >
                <BlurBg url={streamer.channelImageUrl} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center gap-3 px-3">
                  <ProfileCircle
                    url={streamer.channelImageUrl}
                    name={streamer.channelName}
                  />
                  <div className="min-w-0 flex-1 items-center">
                    <p className="text-white font-bold md:text-xl truncate">
                      {streamer.channelName}
                    </p>
                    <p className="text-white/60 text-xs md:text-sm truncate">
                      {streamer.topGames.join(" · ")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className="text-white text-3xl md:text-5xl leading-tight"
                      style={{ fontFamily: "var(--font-anton)" }}
                    >
                      {avgViewers(streamer).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 4~11위 — 2열 콤팩트 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ">
          {rest.map((streamer, idx) => (
            <Link
              key={streamer.channelId}
              href={`/streamers/${streamer.channelId}`}
              className="relative h-20 md:h-36 overflow-hidden rounded-xl"
            >
              <BlurBg url={streamer.channelImageUrl} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center gap-3 px-3">
                <ProfileCircle
                  url={streamer.channelImageUrl}
                  name={streamer.channelName}
                />
                <div className="min-w-0 flex-1 items-center">
                  <p className="text-white font-bold md:text-lg truncate">
                    {streamer.channelName}
                  </p>
                  <p className="text-white/60 text-xs truncate">
                    {streamer.topGames.join(" · ")}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className="text-white text-2xl md:text-4xl leading-tight"
                    style={{ fontFamily: "var(--font-anton)" }}
                  >
                    {avgViewers(streamer).toLocaleString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
