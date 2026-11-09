"use client";

import { useState } from "react";
import Image from "next/image";
import {
  MessageCircle,
  Trophy,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Info,
} from "lucide-react";
import type {
  StreamerChatStats as Stats,
  StreamerChatVideo,
} from "@/lib/chatStats";

const PAGE_SIZE = 6;

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

function formatDate(iso: string) {
  const kst = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  const mo = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${kst.getUTCFullYear()}.${mo}.${d}`;
}

function VideoCard({ v }: { v: StreamerChatVideo }) {
  const href = v.videoNo
    ? `https://chzzk.naver.com/video/${v.videoNo}`
    : undefined;

  const body = (
    <>
      <div className="relative aspect-video w-full bg-muted">
        {v.thumbnailUrl && (
          <Image
            src={v.thumbnailUrl}
            alt={v.videoTitle}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 33vw, 50vw"
          />
        )}
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {formatDuration(v.durationSec)}
        </span>
      </div>

      <div className="space-y-1 p-3">
        {/* 채팅 수: 카드의 주인공 */}
        <p className="flex items-baseline gap-1">
          <span
            className="text-xl font-bold tabular-nums md:text-2xl"
            style={{ color: "var(--chart-1)" }}
          >
            {v.chatPerMin.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">개/분</span>
        </p>
        <p className="truncate text-xs text-muted-foreground">{v.videoTitle}</p>
        <p className="text-[11px] text-muted-foreground/60">
          {formatDate(v.publishDate)}
        </p>
      </div>
    </>
  );

  const cls =
    "block overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-colors";
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${cls} hover:border-white/25 hover:bg-white/[0.06]`}
    >
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function PagedGrid({
  items,
  page,
  onPage,
}: {
  items: StreamerChatVideo[];
  page: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const p = Math.min(page, totalPages - 1);
  const pageItems = items.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);

  const navBtn =
    "rounded-md border p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {pageItems.map((v) => (
          <VideoCard key={v.videoId} v={v} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            onClick={() => onPage(p - 1)}
            disabled={p === 0}
            aria-label="이전 페이지"
            className={navBtn}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="tabular-nums text-muted-foreground">
            <b className="text-foreground">{p + 1}</b> / {totalPages}
          </span>
          <button
            onClick={() => onPage(p + 1)}
            disabled={p >= totalPages - 1}
            aria-label="다음 페이지"
            className={navBtn}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function StreamerChatStats({
  videos,
  recentAvg,
  recentCount,
  rank,
  total,
  poolSize,
}: Stats) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(0);

  if (videos.length === 0) return null;

  const preview = videos.slice(0, 3);
  const mobileRest = videos.slice(2); // 모바일: 미리보기 2개 다음부터
  const desktopRest = videos.slice(3); // PC: 미리보기 3개 다음부터

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="flex items-center gap-2 text-lg md:text-xl font-bold">
          <span
            className="w-1 h-5 md:h-6 rounded-full"
            style={{ background: "var(--chart-1)" }}
          />
          채팅 활발도
        </h2>

        <div className="relative group" tabIndex={0}>
          <Info className="w-5 h-5 text-muted-foreground cursor-help" />
          <div className="absolute left-0 top-full mt-2 w-72 p-3 rounded-lg bg-white/10 backdrop-blur-sm text-xs text-white/70 hidden group-hover:block group-focus:block z-10 space-y-1">
            <p>· 다시보기를 9등분한 8개 지점에서 직전 채팅 50개를 확인해요</p>
            <p>
              · 50개가 올라오는 데 걸린 시간으로 그 지점의 분당 채팅 수를
              계산해요
            </p>
            <p>
              · 순간적으로 채팅이 터진 구간에 휘둘리지 않도록, 8개 지점의
              중앙값을 그 다시보기의 값으로 써요
            </p>
            <p>
              · 상단의 분당 채팅은 최근 다시보기 {recentCount}개의 평균이에요
            </p>
            <p>
              · 순위는 최근 7일 평균 시청자 TOP {poolSize} 스트리머끼리 비교한
              결과예요
            </p>
            <p>· 표본으로 추정한 값이라 실제 채팅 수와 차이가 있을 수 있어요</p>
          </div>
        </div>
      </div>

      {/* 요약 */}
      <div className="w-fit max-w-full rounded-2xl border bg-card px-5 py-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <p className="mb-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5" />
              분당 채팅
            </p>
            <p className="text-4xl font-semibold">
              <span className="mr-1 text-sm font-normal text-muted-foreground">
                약
              </span>
              {recentAvg.toLocaleString()}
              <span className="ml-0.5 text-sm font-normal text-muted-foreground">
                개
              </span>
            </p>
          </div>

          {rank !== null && (
            <>
              <div className="h-12 w-px bg-border" />
              <div>
                <p className="mb-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Trophy className="h-3.5 w-3.5" />
                  시청자 TOP {poolSize} 중
                </p>
                <p className="text-4xl font-semibold">
                  <span style={{ color: "var(--chart-1)" }}>{rank}</span>
                  <span className="ml-0.5 text-sm font-normal text-muted-foreground">
                    위
                  </span>
                </p>
              </div>
            </>
          )}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          최근 다시보기 {recentCount}개 기준
          {rank !== null && ` · 데이터가 있는 ${total}명 중 순위`}
        </p>
      </div>

      {/* 최신 다시보기 (모바일 2개, PC 3개) */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {preview.map((v, i) => (
          <div key={v.videoId} className={i === 2 ? "hidden md:block" : ""}>
            <VideoCard v={v} />
          </div>
        ))}
      </div>

      {/* 전체보기 */}
      {mobileRest.length > 0 && (
        <div className={desktopRest.length === 0 ? "md:hidden" : ""}>
          <button
            onClick={() => {
              setExpanded((e) => !e);
              setPage(0);
            }}
            className="flex w-full items-center justify-center gap-1 rounded-lg border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            {expanded ? "접기" : `전체 보기`}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>

          {expanded && (
            <div className="mt-4">
              <div className="md:hidden">
                <PagedGrid items={mobileRest} page={page} onPage={setPage} />
              </div>
              <div className="hidden md:block">
                <PagedGrid items={desktopRest} page={page} onPage={setPage} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
