"use client";

import { useState, useTransition, useDeferredValue, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { DateRange } from "react-day-picker";
import { format, subDays } from "date-fns";
import type { TopStreamerEntry } from "@/lib/gameStats";
import { UnderlineTabs } from "@/components/shared/UnderlineTabs";
import { DateFilterTab } from "../ui/date-filter-tab";
import { formatDuration } from "@/lib/utils";
import { Info } from "lucide-react";
import { ACTIVE_FESTIVALS } from "@/lib/data/festival";

type Props = {
  topRecords: TopStreamerEntry[];
  topChannels: TopStreamerEntry[];
  categoryId: string;
  defaultDisplayLimit?: number;
};

type BroadcastEntry = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  broadcastCount: number;
  avgViewers: number;
};

type SortKey = "broadcast" | "avgViewers";

const baseTabs = [
  { label: "채널별 최고", key: "channels" as const },
  { label: "전체 기록", key: "records" as const },
  { label: "방송 시간", key: "broadcast" as const },
];

const sortTabs = [
  { label: "방송 시간순", key: "broadcast" as const },
  { label: "평균 시청자순", key: "avgViewers" as const },
];

const PAGE_SIZE = 20;

const medalStyle: Record<number, { bg: string; text: string }> = {
  1: { bg: "bg-amber-400/15", text: "text-amber-300" },
  2: { bg: "bg-zinc-300/15", text: "text-zinc-200" },
  3: { bg: "bg-orange-500/15", text: "text-orange-300" },
};

function RankBadge({ rank }: { rank: number }) {
  const style = medalStyle[rank];
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
        style ? `${style.bg} ${style.text}` : "bg-muted text-muted-foreground"
      }`}
    >
      {rank}
    </div>
  );
}

type ActiveTab = "records" | "channels" | "broadcast" | "tournament";

export function GameTopStreamers({
  topRecords,
  topChannels,
  categoryId,
  defaultDisplayLimit = 10,
}: Props) {
  const festival = ACTIVE_FESTIVALS[categoryId] ?? null;
  const tabs = festival
    ? [...baseTabs, { label: festival.label, key: "tournament" as const }]
    : baseTabs;
  // 팀 구조(teams) 안의 channelId를 전부 펼쳐서 API 조회용으로 씀
  const festivalChannelIds = useMemo(
    () =>
      festival?.teams.flatMap((t) => t.members.map((m) => m.channelId)) ?? [],
    [festival],
  );

  const [active, setActive] = useState<ActiveTab>("channels");
  const [includeTournaments, setIncludeTournaments] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const [dayCount, setDayCount] = useState<number | null>(7);
  const [broadcastData, setBroadcastData] = useState<BroadcastEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  // 대회 참가자 목록은 "방송 시간" 탭 데이터와 별개로 관리 (탭 전환 시 서로 안 섞이게)
  const [tournamentData, setTournamentData] = useState<BroadcastEntry[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("broadcast");
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, startLoadingMore] = useTransition();
  const deferredData = useDeferredValue<BroadcastEntry[]>(broadcastData);
  const deferredTournamentData =
    useDeferredValue<BroadcastEntry[]>(tournamentData);
  const isStale = broadcastData !== deferredData;
  const isTournamentStale = tournamentData !== deferredTournamentData;
  const rawList = active === "records" ? topRecords : topChannels;
  const filteredList = includeTournaments
    ? rawList
    : rawList.filter((e) => !e.isTournament);
  // 이미 서버에서 넉넉히(최대 50개) 받아온 목록을 화면에는 조금씩만 보여준다.
  // "더 보기"를 누르면 이미 받아온 데이터 안에서 displayCount만 늘려서 추가로 노출한다.
  const [displayCount, setDisplayCount] = useState(defaultDisplayLimit);
  // 탭 전환이나 대회 포함 여부가 바뀌면 다시 처음(10개)부터 보여준다.
  // useEffect로 리셋하면 렌더가 한 번 더 도니, 렌더링 중에 바로 조정한다.
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  const listKey = `${active}-${includeTournaments}`;
  const [prevListKey, setPrevListKey] = useState(listKey);
  if (listKey !== prevListKey) {
    setPrevListKey(listKey);
    setDisplayCount(defaultDisplayLimit);
  }
  const list = filteredList.slice(0, displayCount);
  const hasMoreTop = filteredList.length > displayCount;

  async function fetchBroadcast(
    from: string,
    to: string,
    skip: number,
    sort: SortKey,
    append = false,
    channelIds?: string[],
  ) {
    const channelIdsParam = channelIds?.length
      ? `&channelIds=${channelIds.join(",")}`
      : "";
    const res = await fetch(
      `/api/game-broadcast-rank?categoryId=${categoryId}&from=${from}&to=${to}&skip=${skip}&orderBy=${sort}${channelIdsParam}`,
    );
    const data: BroadcastEntry[] = await res.json();

    if (channelIds) {
      // 대회 참가자 목록 탭
      if (append) {
        setTournamentData((prev) => [...prev, ...data]);
      } else {
        setTournamentData(data);
      }
    } else {
      // 일반 "방송 시간" 탭
      if (append) {
        setBroadcastData((prev) => [...prev, ...data]);
      } else {
        setBroadcastData(data);
      }
      setHasMore(data.length === PAGE_SIZE);
    }
  }

  function handleDateChange(range: DateRange, days: number | null) {
    setDateRange(range);
    setDayCount(days);
    const from = format(range.from!, "yyyy-MM-dd");
    const to = format(range.to!, "yyyy-MM-dd");
    startTransition(async () => {
      await fetchBroadcast(
        from,
        to,
        0,
        sortKey,
        false,
        active === "tournament" ? festivalChannelIds : undefined,
      );
    });
  }

  function handleTabChange(key: ActiveTab) {
    setActive(key);
    if (key === "broadcast" && broadcastData.length === 0) {
      const from = format(dateRange.from!, "yyyy-MM-dd");
      const to = format(dateRange.to!, "yyyy-MM-dd");
      startTransition(async () => {
        await fetchBroadcast(from, to, 0, sortKey);
      });
    }
    if (key === "tournament" && festival && tournamentData.length === 0) {
      const from = format(dateRange.from!, "yyyy-MM-dd");
      const to = format(dateRange.to!, "yyyy-MM-dd");
      startTransition(async () => {
        await fetchBroadcast(from, to, 0, sortKey, false, festivalChannelIds);
      });
    }
  }

  function handleSortChange(sort: SortKey) {
    setSortKey(sort);
    const from = format(dateRange.from!, "yyyy-MM-dd");
    const to = format(dateRange.to!, "yyyy-MM-dd");
    startTransition(async () => {
      await fetchBroadcast(
        from,
        to,
        0,
        sort,
        false,
        active === "tournament" ? festivalChannelIds : undefined,
      );
    });
  }

  function handleLoadMore() {
    const from = format(dateRange.from!, "yyyy-MM-dd");
    const to = format(dateRange.to!, "yyyy-MM-dd");
    const isTournamentTab = active === "tournament";
    startLoadingMore(async () => {
      await fetchBroadcast(
        from,
        to,
        isTournamentTab ? tournamentData.length : broadcastData.length,
        sortKey,
        true,
        isTournamentTab ? festivalChannelIds : undefined,
      );
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="flex items-center gap-2 text-lg md:text-xl font-bold">
          <span
            className="w-1 h-5 md:h-6 rounded-full"
            style={{ background: "var(--chart-1)" }}
          />
          스트리머 기록
        </h2>
        <div className="relative group">
          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
          <div className="absolute left-0 top-full mt-2 w-64 p-3 rounded-lg bg-white/10 backdrop-blur-sm text-xs text-white/70 hidden group-hover:block z-10 space-y-1">
            <p>
              · 5분 간격으로 수집되어 실제 방송 시간과 차이가 있을 수 있어요
            </p>
            <p>· 오늘 데이터는 매일 06:00에 집계돼요</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <UnderlineTabs
          options={tabs}
          active={active}
          onChange={handleTabChange}
        />
        {(active === "broadcast" || active === "tournament") && (
          <DateFilterTab
            dateRange={dateRange}
            dayCount={dayCount}
            onChange={handleDateChange}
            presets={[
              { label: "7일", days: 7 },
              { label: "14일", days: 14 },
              { label: "30일", days: 30 },
            ]}
          />
        )}
        {(active === "records" || active === "channels") && (
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeTournaments}
              onChange={(e) => setIncludeTournaments(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border accent-primary"
            />
            공식 대회 채널 포함
          </label>
        )}
      </div>

      {active === "tournament" && festival ? (
        <div className="space-y-3">
          {(() => {
            // channelId -> 조회된 방송시간 데이터 빠르게 찾기 위한 lookup
            const dataByChannelId = new Map(
              deferredTournamentData.map((e) => [e.channelId, e]),
            );

            if (isPending && deferredTournamentData.length === 0) {
              return (
                <p className="text-sm text-muted-foreground">로딩 중...</p>
              );
            }

            return (
              <div
                className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${
                  isTournamentStale ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {festival.teams.map((team) => (
                  <div
                    key={team.teamName}
                    className="rounded-lg border bg-card p-3"
                  >
                    <p className="mb-2 text-sm font-bold">{team.teamName}</p>
                    <div className="divide-y">
                      {team.members.map((member) => {
                        const entry = dataByChannelId.get(member.channelId);
                        return (
                          <Link
                            key={member.channelId}
                            href={`/streamers/${member.channelId}`}
                            className="flex items-center gap-2.5 py-2 transition-colors hover:bg-muted/50"
                          >
                            {entry?.channelImageUrl ? (
                              <Image
                                src={entry.channelImageUrl}
                                alt={member.name}
                                width={32}
                                height={32}
                                className="h-8 w-8 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                                {member.name[0]}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate text-sm font-medium">
                                  {member.name}
                                </p>
                                {member.isLeader && (
                                  <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                    팀장
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="shrink-0 text-xs font-semibold text-muted-foreground">
                              {entry
                                ? formatDuration(entry.broadcastCount)
                                : "방송 없음"}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      ) : active === "broadcast" ? (
        <div className="space-y-3">
          <div className="flex justify-end gap-3">
            {sortTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleSortChange(tab.key)}
                className={`text-xs transition-colors ${
                  sortKey === tab.key
                    ? "text-primary border-b border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {(() => {
            if (isPending && deferredData.length === 0) {
              return (
                <p className="text-sm text-muted-foreground">로딩 중...</p>
              );
            }
            if (deferredData.length === 0) {
              return (
                <p className="text-sm text-muted-foreground">데이터 없음</p>
              );
            }
            return (
              <>
                <div
                  className={`divide-y rounded-lg border bg-card ${isStale ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {deferredData.map((entry: BroadcastEntry, i) => (
                    <Link
                      key={entry.channelId}
                      href={`/streamers/${entry.channelId}`}
                      className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50 md:gap-4 md:p-4"
                    >
                      <RankBadge rank={i + 1} />
                      {entry.channelImageUrl && (
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                          <Image
                            src={entry.channelImageUrl}
                            alt={entry.channelName}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {entry.channelName}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold">
                          {formatDuration(entry.broadcastCount)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="w-full py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoadingMore ? "로딩 중..." : "더 보기"}
                  </button>
                )}
              </>
            );
          })()}
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">데이터 없음</p>
      ) : (
        <div className="space-y-3">
          <div className="divide-y rounded-lg border bg-card">
            {list.map((entry, i) => (
              <Link
                key={`${entry.channelId}-${i}`}
                href={`/streamers/${entry.channelId}`}
                className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50 md:gap-4 md:p-4"
              >
                <RankBadge rank={i + 1} />
                {entry.channelImageUrl && (
                  <Image
                    src={entry.channelImageUrl}
                    alt={entry.channelName}
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {entry.channelName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {entry.liveTitle}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold">
                    {entry.maxViewers.toLocaleString()}명
                  </p>
                  <p className="text-xs text-muted-foreground">{entry.date}</p>
                </div>
              </Link>
            ))}
          </div>

          {hasMoreTop && (
            <button
              onClick={() =>
                setDisplayCount((prev) => prev + defaultDisplayLimit)
              }
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
            >
              더 보기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
