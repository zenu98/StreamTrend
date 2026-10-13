"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { formatCount } from "./StreamersClient";

type StreamerRankingEntry = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  followerCount: number;
  verifiedMark: boolean;
  avgViewers: number;
  maxViewers: number;
};

type SortKey = "avgViewers" | "maxViewers" | "followerCount";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "avgViewers", label: "평균 시청자" },
  { key: "maxViewers", label: "최고 시청자" },
  { key: "followerCount", label: "팔로워" },
];

export function StreamerRankingList({
  streamers,
}: {
  streamers: StreamerRankingEntry[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("avgViewers");
  const [query, setQuery] = useState("");

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return streamers.filter((s) => s.channelName.toLowerCase().includes(q));
  }, [streamers, query]);

  const sorted = useMemo(
    () => [...streamers].sort((a, b) => b[sortKey] - a[sortKey]),
    [streamers, sortKey],
  );

  return (
    <div className="space-y-4">
      {/* <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="스트리머 이름 검색"
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-9 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div> */}

      {query && (
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="px-1 text-xs text-white/40">
            &ldquo;{query}&rdquo; 검색 결과 {searchResults.length}개
          </p>
          {searchResults.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">
              {`해당하는 스트리머가 ${streamers.length}위 안에 없어요. 더보기를 눌러 리스트를 더 불러와보세요.`}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {searchResults.map((s) => (
                <StreamerRankingRow
                  key={`search-${s.channelId}`}
                  streamer={s}
                  rank={
                    sorted.findIndex((x) => x.channelId === s.channelId) + 1
                  }
                  sortKey={sortKey}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortKey(opt.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              sortKey === opt.key
                ? "border-white/30 bg-white/10 text-white"
                : "border-white/10 text-white/40 hover:text-white/70"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {sorted.map((s, i) => (
          <StreamerRankingRow
            key={s.channelId}
            streamer={s}
            rank={i + 1}
            sortKey={sortKey}
          />
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  active,
  formatter,
}: {
  label: string;
  value: number;
  active: boolean;
  formatter?: (n: number) => string;
}) {
  return (
    <div
      className={`w-20 shrink-0 text-right ${active ? "block" : "hidden sm:block"}`}
    >
      <p
        className={`text-[11px] ${active ? "text-white/80" : "text-white/50"}`}
      >
        {label}
      </p>
      <p
        className={`text-sm tabular-nums ${active ? "font-semibold text-white" : "text-white/70"}`}
      >
        {formatter ? formatter(value) : value.toLocaleString()}
      </p>
    </div>
  );
}

function StreamerRankingRow({
  streamer,
  rank,
  sortKey,
}: {
  streamer: StreamerRankingEntry;
  rank: number;
  sortKey: SortKey;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 overflow-hidden rounded-xl border border-white/10 pr-2 transition-colors hover:bg-white/5">
      <Link
        href={`/streamers/${streamer.channelId}`}
        className="flex min-w-0 flex-1 items-center gap-4 px-4 py-2.5"
      >
        <span className="w-5 shrink-0 text-sm text-white/40">{rank}</span>

        <div className="relative h-10.5 w-10.5 shrink-0 overflow-hidden rounded-full bg-white/10">
          {streamer.channelImageUrl ? (
            <Image
              src={streamer.channelImageUrl}
              alt={streamer.channelName}
              fill
              className="object-cover"
              sizes="42px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/30">
              {streamer.channelName[0]}
            </div>
          )}
        </div>

        <div className="flex min-w-0 max-w-[200px] flex-1 items-center gap-1 sm:max-w-[360px]">
          <p className="truncate text-sm font-medium text-white">
            {streamer.channelName}
          </p>
          {streamer.verifiedMark && (
            <Image
              src="https://ssl.pstatic.net/static/nng/glive/image/icon_official_mark.png"
              alt="파트너"
              width={13}
              height={13}
              className="shrink-0"
            />
          )}
        </div>

        <div className="flex flex-1 min-w-0 items-center justify-end gap-[clamp(0.5rem,1.5vw,4.5rem)]">
          <Stat
            label="평균 시청자"
            value={streamer.avgViewers}
            active={sortKey === "avgViewers"}
          />
          <Stat
            label="최고 시청자"
            value={streamer.maxViewers}
            active={sortKey === "maxViewers"}
          />
          <Stat
            label="팔로워"
            value={streamer.followerCount}
            active={sortKey === "followerCount"}
            formatter={formatCount}
          />
        </div>
      </Link>
    </div>
  );
}
