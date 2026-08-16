import Image from "next/image";
import Link from "next/link";
import { Users, Radio } from "lucide-react";

type CurrentMaxViewer = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  concurrentUserCount: number;
  liveTitle: string;
} | null;

type TopLiveStreamer = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  liveThumbnailImageUrl: string | null;
  concurrentUserCount: number;
  liveTitle: string;
};

type Props = {
  currentViewers: number;
  currentCount: number;
  viewerTier?: string;
  countTier?: string;
  currentMaxViewer: CurrentMaxViewer;
  topLiveStreamers?: TopLiveStreamer[];
};

const tierColors: Record<string, string> = {
  S: "text-fuchsia-300 bg-fuchsia-400/10",
  A: "text-orange-300 bg-orange-400/10",
  B: "text-sky-300 bg-sky-400/10",
  C: "text-slate-300 bg-slate-400/10",
};

const tierGradients: Record<string, string> = {
  S: "linear-gradient(90deg, #A855F7, #EC4899)",
  A: "linear-gradient(90deg, #F97316, #EF4444)",
  B: "linear-gradient(90deg, #3B82F6, #06B6D4)",
  C: "linear-gradient(90deg, #94A3B8, #CBD5E1)",
  default: "linear-gradient(90deg, #6366F1, #8B5CF6)",
};

function TierBadge({ tier }: { tier?: string }) {
  if (!tier) return null;
  return (
    <span
      className={`rounded px-1 text-[10px] font-semibold ${
        tierColors[tier] ?? tierColors.C
      }`}
    >
      {tier}
    </span>
  );
}

function GradientNumber({ value, tier }: { value: string; tier?: string }) {
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage:
          tierGradients[tier ?? "default"] ?? tierGradients.default,
      }}
    >
      {value}
    </span>
  );
}

export function CurrentStatsStrip({
  currentViewers,
  currentCount,
  viewerTier,
  countTier,
  topLiveStreamers,
}: Props) {
  const tierBorderColors: Record<string, string> = {
    S: "#d946ef50",
    A: "#f9731650",
    B: "#3b82f650",
    C: "#94a3b850",
  };

  const borderColor = tierBorderColors[viewerTier ?? "C"] ?? "#94a3b8f50";
  return (
    <div className="space-y-4">
      {/* 현재 수치 */}
      <div
        style={{ border: `1px solid ${borderColor}` }}
        className="w-fit max-w-full rounded-2xl border bg-card px-5 py-6"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-col gap-0">
            <p className="mb-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>현재 시청자</span>
              <TierBadge tier={viewerTier} />
            </p>
            <p className="text-4xl font-semibold">
              <GradientNumber
                value={currentViewers.toLocaleString()}
                tier={viewerTier}
              />
              <span className="ml-0.5 text-sm font-normal text-muted-foreground">
                명
              </span>
            </p>
          </div>

          <div className="h-12 w-px bg-border" />

          <div>
            <p className="mb-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Radio className="h-3.5 w-3.5" />
              현재 방송 수
              <TierBadge tier={countTier} />
            </p>
            <p className="text-4xl font-semibold">
              <GradientNumber
                value={currentCount.toLocaleString()}
                tier={countTier}
              />
              <span className="ml-0.5 text-sm font-normal text-muted-foreground">
                개
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* TOP 3 라이브 썸네일 */}
      {topLiveStreamers && topLiveStreamers.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none md:grid md:grid-cols-3">
          {topLiveStreamers.map((streamer) => (
            <a
              key={streamer.channelId}
              href={`https://chzzk.naver.com/live/${streamer.channelId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-video w-64 flex-shrink-0 overflow-hidden rounded-xl border bg-card md:w-auto"
            >
              {streamer.liveThumbnailImageUrl ? (
                <Image
                  src={streamer.liveThumbnailImageUrl.replace("{type}", "480")}
                  alt={streamer.liveTitle}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="33vw"
                />
              ) : (
                <div className="absolute inset-0 bg-muted" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2 ">
                <p className="text-xs mb-1 text-white/90 font-bold ">
                  <span>{streamer.liveTitle}</span>
                </p>

                <div className="flex items-center gap-1.5 mb-0.5">
                  {streamer.channelImageUrl && (
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                      <Image
                        src={streamer.channelImageUrl}
                        alt={streamer.channelName}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <p className=" text-xs font-bold tracking-wide text-white/80 truncate">
                    <span>{streamer.channelName}</span>
                  </p>
                </div>
              </div>
              <div className="absolute top-2 left-2 flex items-center justify-center">
                <div
                  className="flex items-center bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white rounded-xs leading-none"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  LIVE
                </div>
                <div
                  style={{ fontFamily: "Arial, sans-serif" }}
                  className="flex items-center   bg-black/80 px-1.5 py-0.5 text-xs font-semibold rounded-xs leading-none text-white"
                >
                  {streamer.concurrentUserCount.toLocaleString()}명
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
