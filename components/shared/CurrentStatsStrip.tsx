"use client";

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

type Props = {
  currentViewers: number;
  currentCount: number;
  viewerTier?: string;
  countTier?: string;
  currentMaxViewer: CurrentMaxViewer;
};

const tierColors: Record<string, string> = {
  S: "text-fuchsia-300 bg-fuchsia-400/10",
  A: "text-orange-300 bg-orange-400/10",
  B: "text-sky-300 bg-sky-400/10",
  C: "text-slate-300 bg-slate-400/10",
};

// ChartRadialText의 gradients 객체와 동일한 값 (티어별 색 통일)
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

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
        style={{ background: "var(--chart-1)" }}
      />
      <span
        className="relative inline-flex h-2 w-2 rounded-full"
        style={{ background: "var(--chart-1)" }}
      />
    </span>
  );
}

export function CurrentStatsStrip({
  currentViewers,
  currentCount,
  viewerTier,
  countTier,
  currentMaxViewer,
}: Props) {
  return (
    <div className="w-fit max-w-full space-y-3 rounded-2xl border bg-card px-5 py-6">
      {/* <div className="flex justify-end items-center gap-1.5">
        <LiveDot />
        <span className="text-xs text-muted-foreground">실시간</span>
      </div> */}

      <div className="flex flex-wrap  items-center gap-x-6 gap-y-3">
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

        {currentMaxViewer && (
          <>
            <div className="h-12 w-px bg-border" />
            <Link
              href={`/streamers/${currentMaxViewer.channelId}`}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1 transition-colors hover:bg-muted/50"
            >
              {currentMaxViewer.channelImageUrl && (
                <Image
                  src={currentMaxViewer.channelImageUrl}
                  alt={currentMaxViewer.channelName}
                  width={34}
                  height={34}
                  className="shrink-0 rounded-full object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  현재 최고 시청자
                </p>
                <p className="truncate text-sm font-medium">
                  {currentMaxViewer.channelName}
                  <span className="ml-1 font-normal text-muted-foreground">
                    · {currentMaxViewer.concurrentUserCount.toLocaleString()}명
                  </span>
                </p>
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
