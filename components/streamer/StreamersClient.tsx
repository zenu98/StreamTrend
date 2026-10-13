"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { StreamerSearch } from "@/components/streamer/StreamerSearch";
import { StreamerRankingList } from "@/components/streamer/StreamerRankingList";
import { MonthWeekFilterTab } from "../ui/month-week-tab";
import { MCN_KEYS, MCNKey } from "@/lib/data/mcn";
import { GROUP_KEYS, GroupKey } from "@/lib/data/groups";
import { type Streamer } from "@/lib/streamers";

type TopTab = "전체" | "파트너" | "MCN" | "그룹";
type SortKey = "recentAvgViewers" | "followerCount";

type MonthGroup = { label: string; weeks: { label: string }[] };

type StreamerRankingEntry = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  verifiedMark: boolean;
  followerCount: number;
  avgViewers: number;
  maxViewers: number;
};

type Props = {
  partnerStreamers: Streamer[];
  mcnStreamers: Record<string, Streamer[]>;
  groupStreamers: Record<string, Streamer[]>;
  rankingGroups: MonthGroup[];
  initialMonthIndex: number;
  initialWeekIndex: number;
  initialRankingStreamers: StreamerRankingEntry[];
};

// formatCount, StreamerRow는 기존 그대로 (생략 없이 유지)
export function formatCount(n: number): string {
  if (n >= 10000) {
    const man = n / 10000;
    // 정수면 소수점 없이, 아니면 소수점 첫째 자리까지
    return Number.isInteger(man) ? `${man}만` : `${man.toFixed(1)}만`;
  }
  return n.toLocaleString();
}

function StreamerRow({
  streamer,
  rank,
  sort,
}: {
  streamer: Streamer;
  rank: number;
  sort: SortKey;
}) {
  const rankColor =
    rank === 1
      ? "#f59e0b"
      : rank === 2
        ? "#9ca3af"
        : rank === 3
          ? "#b45309"
          : undefined;

  return (
    <Link
      href={`/streamers/${streamer.channelId}`}
      className="flex items-center gap-3 md:gap-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors rounded-lg px-2"
    >
      <span
        className={`w-5 md:w-6 text-center flex-shrink-0 ${rank <= 3 ? "text-base md:text-lg font-bold" : "text-sm font-medium text-muted-foreground"}`}
        style={rankColor ? { color: rankColor } : undefined}
      >
        {rank}
      </span>

      <div
        className="w-9 h-9 md:w-11 md:h-11 rounded-full overflow-hidden flex-shrink-0"
        style={{
          border:
            rank <= 3 && rankColor
              ? `2px solid ${rankColor}`
              : "2px solid hsl(var(--border))",
        }}
      >
        {streamer.channelImageUrl ? (
          <Image
            src={streamer.channelImageUrl}
            alt={streamer.channelName}
            width={44}
            height={44}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-sm">
            {streamer.channelName[0]}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold truncate">
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
        {streamer.topGames.length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {streamer.topGames.join(" · ")}
          </p>
        )}
      </div>

      <div className="text-right flex-shrink-0 self-center">
        <p className="text-sm font-semibold">
          {sort === "recentAvgViewers"
            ? `${formatCount(streamer.recentAvgViewers)}명`
            : `${formatCount(streamer.followerCount)}명`}
        </p>
      </div>
    </Link>
  );
}

export function StreamersClient({
  partnerStreamers,
  mcnStreamers,
  groupStreamers,
  rankingGroups,
  initialMonthIndex,
  initialWeekIndex,
  initialRankingStreamers,
}: Props) {
  const [tab, setTab] = useState<TopTab>("전체");
  const [selectedMCN, setSelectedMCN] = useState<MCNKey>(MCN_KEYS[0]);
  const [selectedGroup, setSelectedGroup] = useState<GroupKey | null>(
    GROUP_KEYS.length > 0 ? GROUP_KEYS[0] : null,
  );
  const [sort, setSort] = useState<SortKey>("recentAvgViewers");

  const LIMIT = 20;
  const [limit, setLimit] = useState(LIMIT);

  // "전체" 탭 전용 상태 — 서버에서 받은 초기값으로 시작, 이후 핸들러에서만 갱신
  const [monthIndex, setMonthIndex] = useState(initialMonthIndex);
  const [weekIndex, setWeekIndex] = useState(initialWeekIndex);
  const [excludeBroadcast, setExcludeBroadcast] = useState(true);
  const [rankingStreamers, setRankingStreamers] = useState<
    StreamerRankingEntry[]
  >(initialRankingStreamers);
  const [isPending, startTransition] = useTransition();

  function fetchRanking(m: number, w: number, exclude: boolean) {
    startTransition(async () => {
      const res = await fetch(
        `/api/streamer-ranking?month=${m}&week=${w}&excludeBroadcast=${exclude}`,
      );
      if (!res.ok) return;
      const json = await res.json();
      setRankingStreamers(json.streamers);
    });
  }

  function handleWeekChange(m: number, w: number) {
    setMonthIndex(m);
    setWeekIndex(w);
    fetchRanking(m, w, excludeBroadcast);
  }

  function handleExcludeBroadcastChange(checked: boolean) {
    setExcludeBroadcast(checked);
    fetchRanking(monthIndex, weekIndex, checked);
  }

  function sorted(list: Streamer[]) {
    return [...list].sort((a, b) => b[sort] - a[sort]);
  }

  function currentList(): Streamer[] {
    if (tab === "파트너") return sorted(partnerStreamers);
    if (tab === "MCN") return sorted(mcnStreamers[selectedMCN] ?? []);
    if (tab === "그룹" && selectedGroup)
      return sorted(groupStreamers[selectedGroup] ?? []);
    return [];
  }
  const list = currentList();
  const visibleList = list.slice(0, limit);

  return (
    <main>
      <div className="mb-5">
        <StreamerSearch />
      </div>

      <div className="flex items-center border-b border-border mb-4">
        {(["전체", "파트너", "MCN", "그룹"] as TopTab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setLimit(LIMIT);
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
        {tab !== "전체" && (
          <div className="flex gap-3 ml-auto pb-2">
            {(["recentAvgViewers", "followerCount"] as SortKey[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`text-xs transition-colors ${
                  sort === s
                    ? "text-primary border-b border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "recentAvgViewers" ? "평균시청자" : "팔로워"}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === "전체" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MonthWeekFilterTab
              groups={rankingGroups}
              monthIndex={monthIndex}
              weekIndex={weekIndex}
              onChange={handleWeekChange}
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={excludeBroadcast}
                onChange={(e) => handleExcludeBroadcastChange(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border accent-primary"
              />
              중계 채널 제외
            </label>
          </div>

          {isPending ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              불러오는 중...
            </p>
          ) : (
            <StreamerRankingList streamers={rankingStreamers} />
          )}
        </div>
      )}

      {(tab === "MCN" || tab === "그룹") && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          {(tab === "MCN" ? MCN_KEYS : GROUP_KEYS).map((key) => (
            <button
              key={key}
              onClick={() => {
                if (tab === "MCN") setSelectedMCN(key as MCNKey);
                else setSelectedGroup(key as GroupKey);
              }}
              className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors flex-shrink-0 ${
                (tab === "MCN" ? selectedMCN : selectedGroup) === key
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      )}

      {tab !== "전체" &&
        (tab === "그룹" && GROUP_KEYS.length === 0 ? (
          <p className="text-sm text-muted-foreground">준비 중입니다.</p>
        ) : (
          <div>
            {visibleList.map((s, i) => (
              <StreamerRow
                key={s.channelId}
                streamer={s}
                rank={i + 1}
                sort={sort}
              />
            ))}
            {limit < list.length && (
              <button
                onClick={() => setLimit((prev) => prev + LIMIT)}
                className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
              >
                더 보기
              </button>
            )}
          </div>
        ))}
    </main>
  );
}
