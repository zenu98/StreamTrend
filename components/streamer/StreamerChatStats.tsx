"use client";

import { useState } from "react";
import Image from "next/image";
import type { StreamerChatStats as Stats } from "@/lib/chatStats";

const PAGE_SIZE = 10;

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

function formatDate(iso: string) {
  const kst = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const mo = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}.${mo}.${d}`;
}

export function StreamerChatStats({ videos, recentAvg, recentCount }: Stats) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (videos.length === 0) return null;

  const list = videos.slice(0, visibleCount);
  const hasMore = visibleCount < videos.length;
  const maxChat = Math.max(...videos.map((v) => v.chatPerMin), 1);

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg md:text-xl font-bold">
        <span
          className="w-1 h-5 md:h-6 rounded-full"
          style={{ background: "var(--chart-1)" }}
        />
        채팅 활발도
      </h2>

      {/* 요약 */}
      <div className="rounded-lg border bg-card p-4 md:p-5">
        <p className="text-xs text-muted-foreground">
          최근 다시보기 {recentCount}개 평균
        </p>
        <p className="mt-1 text-2xl md:text-3xl font-bold">
          {recentAvg.toLocaleString()}
          <span className="ml-1 text-sm font-medium text-muted-foreground">
            개 / 분
          </span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          각 다시보기의 여러 구간을 표본 조사한 추정치예요.
        </p>
      </div>

      {/* 다시보기 목록 */}
      <div className="divide-y rounded-lg border bg-card">
        {list.map((v) => {
          const href = v.videoNo
            ? `https://chzzk.naver.com/video/${v.videoNo}`
            : undefined;
          const ratio = Math.max(4, Math.round((v.chatPerMin / maxChat) * 100));

          const content = (
            <>
              {v.thumbnailUrl ? (
                <div className="relative aspect-video w-24 md:w-32 shrink-0 overflow-hidden rounded">
                  <Image
                    src={v.thumbnailUrl}
                    alt={v.videoTitle}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 128px, 96px"
                  />
                  <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] text-white">
                    {formatDuration(v.durationSec)}
                  </span>
                </div>
              ) : (
                <div className="aspect-video w-24 md:w-32 shrink-0 rounded bg-muted" />
              )}

              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="line-clamp-2 text-sm font-semibold">
                  {v.videoTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(v.publishDate)}
                </p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${ratio}%`, background: "var(--chart-1)" }}
                  />
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-bold">
                  {v.chatPerMin.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">개/분</p>
              </div>
            </>
          );

          const cls =
            "flex items-center gap-3 p-3 md:gap-4 md:p-4 transition-colors";

          return href ? (
            <a
              key={v.videoId}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${cls} hover:bg-muted/50`}
            >
              {content}
            </a>
          ) : (
            <div key={v.videoId} className={cls}>
              {content}
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          className="w-full rounded-lg border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          더보기
        </button>
      )}
    </div>
  );
}
