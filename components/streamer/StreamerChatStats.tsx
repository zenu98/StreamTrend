"use client";

import { useMemo, useState } from "react";
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

type WeekGroup = {
  key: string;
  label: string;
  range: string;
  videos: StreamerChatVideo[];
  avg: number;
};

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

export function StreamerChatStats({
  videos,
  recentAvg,
  recentCount,
  rank,
  total,
  poolSize,
}: Stats) {
  const [expanded, setExpanded] = useState(false);
  const [weekIdx, setWeekIdx] = useState(0); // 0 = 가장 최근 주

  // 최신순으로 들어온 영상을 주차별로 묶기 (순서 유지)
  const weeks = useMemo<WeekGroup[]>(() => {
    const map = new Map<string, WeekGroup>();
    for (const v of videos) {
      const g = map.get(v.weekKey) ?? {
        key: v.weekKey,
        label: v.weekLabel,
        range: v.weekRange,
        videos: [],
        avg: 0,
      };
      g.videos.push(v);
      map.set(v.weekKey, g);
    }
    return [...map.values()].map((g) => ({
      ...g,
      avg: Math.round(
        g.videos.reduce((s, v) => s + v.chatPerMin, 0) / g.videos.length,
      ),
    }));
  }, [videos]);

  if (videos.length === 0) return null;

  const preview = videos.slice(0, 3);
  const week = weeks[Math.min(weekIdx, weeks.length - 1)];
  const navBtn =
    "flex h-9 shrink-0 items-center gap-1 rounded-lg bg-white/10 px-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20 active:bg-white/25 disabled:bg-white/[0.03] disabled:text-white/20 disabled:hover:bg-white/[0.03]";

  return (
    <div className="space-y-4">
      {/* 제목 + 설명 */}
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
            <p>
              · 다시보기를 8구간으로 나눠, 구간마다 무작위 지점 하나에서 직전
              채팅 50개를 확인해요
            </p>
            <p>
              · 50개가 올라오는 데 걸린 시간으로 그 지점의 분당 채팅 수를
              계산해요
            </p>
            <p>
              · 가장 높은 값과 낮은 값을 하나씩 빼고 평균을 내서, 순간적으로 튄
              구간의 영향을 줄여요
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

      {/* 주차별 보기 */}
      {videos.length > 2 && (
        <div className={videos.length <= 3 ? "md:hidden" : ""}>
          <button
            onClick={() => {
              setExpanded((e) => !e);
              setWeekIdx(0);
            }}
            className="flex w-full items-center justify-center gap-1 rounded-lg border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            {expanded ? "접기" : `주차별로 보기 (다시보기 ${videos.length}개)`}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>

          {expanded && week && (
            <div className="mt-4 space-y-4">
              {/* 주차 이동 바 */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <button
                  onClick={() => setWeekIdx((i) => i + 1)}
                  disabled={weekIdx >= weeks.length - 1}
                  aria-label="이전 주"
                  className={navBtn}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="min-w-0 text-center">
                  <p className="text-sm font-semibold">
                    {week.label}
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      {week.range}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    다시보기 {week.videos.length}개 · 평균 분당 약{" "}
                    <b className="text-foreground">
                      {week.avg.toLocaleString()}
                    </b>
                    개
                  </p>
                </div>
                <button
                  onClick={() => setWeekIdx((i) => i - 1)}
                  disabled={weekIdx === 0}
                  aria-label="다음 주"
                  className={navBtn}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {week.videos.map((v) => (
                  <VideoCard key={v.videoId} v={v} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
