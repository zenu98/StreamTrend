"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AnimeSummary } from "@/lib/animeStats";

const STATUS_LABEL: Record<AnimeSummary["status"], string> = {
  upcoming: "예정",
  airing: "진행 중",
  ended: "종료",
};

function formatPeriod(start: string, end: string) {
  const f = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;
  return `${f(start)} ~ ${f(end)}`;
}

function formatDay(date: string) {
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
}

function Poster({ anime, sizes }: { anime: AnimeSummary; sizes: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-md bg-white/10">
      {anime.thumbnail ? (
        <Image
          src={anime.thumbnail}
          alt={anime.title}
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-lg text-white/40">
          {anime.title[0]}
        </div>
      )}
    </div>
  );
}

function FeaturedCard({ anime }: { anime: AnimeSummary }) {
  const airing = anime.status === "airing";

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card sm:flex-row">
      {/* 왼쪽: 포스터가 카드 높이를 꽉 채움 (모바일에서는 위쪽 배너) */}
      <div className="relative sm:aspect-3/4 h-64 w-full shrink-0 bg-white/10 sm:h-auto sm:w-72 ">
        {anime.thumbnail ? (
          <Image
            src={anime.thumbnail}
            alt={anime.title}
            fill
            sizes="(max-width: 640px) 100vw, 240px"
            className="object-contain sm:object-cover sm:object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-white/30">
            {anime.title[0]}
          </div>
        )}
      </div>

      {/* 오른쪽: 나머지 정보 전부 */}
      <div className="min-w-0 flex-1 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-6 gap-y-4 sm:gap-y-1">
          {/* 1열: 제목 + 날짜를 한 줄로 */}
          <div className="col-span-2 sm:col-span-1 flex min-w-0 items-center gap-2">
            <p className="truncate text-2xl font-bold">{anime.title}</p>
            <span
              className={`inline-flex items-center  shrink-0 rounded-full border px-2 py-0.5 text-xs ${
                airing
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-white/15 text-white/50"
              }`}
            >
              {`${STATUS_LABEL[anime.status]}`}
            </span>
            <p className="shrink-0 text-xs text-muted-foreground">
              {formatPeriod(anime.startDate, anime.endDate)}
            </p>
          </div>

          {/* 2열: 최고 시청자 */}
          <div className="flex flex-col justify-center">
            <p className="text-xs text-muted-foreground">최고 시청자</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums">
              {anime.maxViewers.toLocaleString()}
              <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                명
              </span>
            </p>
          </div>

          {/* 3열: 시청 스트리머 */}
          <div className="flex flex-col justify-center">
            <p className="text-xs text-muted-foreground">시청 스트리머</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums">
              {anime.streamerCount.toLocaleString()}
              <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                명
              </span>
            </p>
          </div>
        </div>

        {anime.topStreamers.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <p className="mb-2 text-xs text-muted-foreground">
              최고 시청자 기록 TOP {anime.topStreamers.length}
            </p>
            <ol className="space-y-1">
              {anime.topStreamers.map((s, i) => (
                <li key={s.channelId}>
                  <Link
                    href={`/streamers/${s.channelId}`}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
                  >
                    <span
                      className={`w-4 shrink-0 text-center text-sm tabular-nums ${
                        i === 0
                          ? "font-semibold text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white/10">
                      {s.channelImageUrl ? (
                        <Image
                          src={s.channelImageUrl}
                          alt={s.channelName}
                          fill
                          sizes="28px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs text-white/60">
                          {s.channelName[0]}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {s.channelName}
                      </p>
                      <p
                        className="truncate text-[11px] text-muted-foreground"
                        title={s.liveTitle}
                      >
                        {formatDay(s.date)} - {s.liveTitle}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {s.maxViewers.toLocaleString()}
                      <span className="ml-0.5 text-[11px] font-normal text-muted-foreground">
                        명
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

export function AnimeSummaryCards({
  summaries,
  compact = false,
}: {
  summaries: AnimeSummary[];
  compact?: boolean;
}) {
  const visible = compact
    ? summaries.filter((a) => a.status !== "ended")
    : summaries;

  const defaultId =
    visible.find((a) => a.status === "airing")?.id ?? visible[0]?.id;
  const [selectedId, setSelectedId] = useState(defaultId);

  const selected = visible.find((a) => a.id === selectedId) ?? visible[0];
  if (!selected) return null;

  return (
    <section className="space-y-3">
      <div>
        {compact ? (
          <h1 className="text-center text-4xl mb-16 md:text-6xl font-extrabold text-white">
            애니메이션 같이보기
          </h1>
        ) : (
          <>
            <h2 className="text-lg font-bold">치지직 공식 상영 애니</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              방송 제목으로 작품을 구분한 집계예요. 오늘 데이터는 제외돼요 (매일
              06:00 집계)
            </p>
          </>
        )}
      </div>

      <FeaturedCard anime={selected} />

      {!compact && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {summaries.map((a) => {
            const active = a.id === selected.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedId(a.id)}
                aria-pressed={active}
                title={a.title}
                className="w-16 shrink-0 text-left sm:w-20"
              >
                <div
                  className={`relative aspect-[3/4] w-full rounded-md ring-2 transition-opacity ${
                    active
                      ? "ring-primary"
                      : "opacity-60 ring-transparent hover:opacity-100"
                  }`}
                >
                  <Poster anime={a} sizes="80px" />
                  {a.status === "airing" && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-400" />
                  )}
                </div>
                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                  {a.title}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {compact && (
        <Link
          href="/games/animation"
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] py-3.5 text-sm font-semibold transition-colors hover:border-white/20"
          style={{
            backgroundSize: "200% 100%",
          }}
        >
          {/* 호버 시 흐르는 그라데이션 */}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-r from-blue-500/0 via-blue-500/20 to-pink-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:animate-[gradient-flow_2s_ease-in-out_infinite]"
            style={{ backgroundSize: "200% 100%" }}
          />

          {/* 빛이 대각선으로 훑고 지나가는 효과 */}
          <span
            aria-hidden="true"
            className="absolute inset-y-0 -left-1/3 z-10 w-1/3 -skew-x-12 bg-linear-to-r from-transparent via-white/20 to-transparent opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100"
          />

          <span className="relative z-20">카테고리로 이동</span>
        </Link>
      )}
    </section>
  );
}
