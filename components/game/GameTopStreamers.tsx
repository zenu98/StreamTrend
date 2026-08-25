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
// "방송 시간" 탭 안에서 뭘 보여줄지: 정렬된 전체 순위(broadcast/avgViewers) 또는 대회 팀별 보기
type BroadcastView = SortKey | "tournament";

const tabs = [
  { label: "채널별 최고", key: "channels" as const },
  { label: "전체 기록", key: "records" as const },
  { label: "방송 시간", key: "broadcast" as const },
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

type ActiveTab = "records" | "channels" | "broadcast";

export function GameTopStreamers({
  topRecords,
  topChannels,
  categoryId,
  defaultDisplayLimit = 10,
}: Props) {
  const festival = ACTIVE_FESTIVALS[categoryId] ?? null;
  // 팀 구조(teams) 안의 channelId를 전부 펼쳐서 API 조회용으로 씀
  const festivalChannelIds = useMemo(
    () =>
      festival?.teams.flatMap((t) => t.members.map((m) => m.channelId)) ?? [],
    [festival],
  );
  // 팀 멤버 카드에 표시될 순서(왼쪽 상수가 저장 순서와 달라도 이 순서대로 재배열됨)
  const ROLE_DISPLAY_ORDER = ["팀장", "1티어", "2티어", "코치"] as const;

  // 역할별 배지 색상
  const roleBadgeStyle: Record<string, string> = {
    팀장: "bg-primary/15 text-primary",
    "1티어": "bg-sky-400/15 text-sky-300",
    "2티어": "bg-emerald-400/15 text-emerald-300",
    코치: "bg-violet-400/15 text-violet-300",
  };
  // "방송 시간" 탭 안에서 고를 수 있는 옵션들. 대회가 있는 카테고리에서만 세 번째 옵션이 추가됨.
  const broadcastViewTabs = [
    { label: "방송 시간순", key: "broadcast" as const },
    { label: "평균 시청자순", key: "avgViewers" as const },
    ...(festival
      ? [{ label: festival.label, key: "tournament" as const }]
      : []),
  ];

  const [active, setActive] = useState<ActiveTab>("channels");
  const [broadcastView, setBroadcastView] =
    useState<BroadcastView>("broadcast");
  const [includeTournaments, setIncludeTournaments] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const [dayCount, setDayCount] = useState<number | null>(7);
  const [broadcastData, setBroadcastData] = useState<BroadcastEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  // 대회 참가자 목록은 "방송 시간" 순위 데이터와 별개로 관리 (전환 시 서로 안 섞이게)
  const [tournamentData, setTournamentData] = useState<BroadcastEntry[]>([]);
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
  const [displayCount, setDisplayCount] = useState(defaultDisplayLimit);
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
      if (append) {
        setTournamentData((prev) => [...prev, ...data]);
      } else {
        setTournamentData(data);
      }
    } else {
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
        broadcastView === "tournament" ? "broadcast" : broadcastView,
        false,
        broadcastView === "tournament" ? festivalChannelIds : undefined,
      );
    });
  }

  function handleTabChange(key: ActiveTab) {
    setActive(key);
    if (
      key === "broadcast" &&
      broadcastView !== "tournament" &&
      broadcastData.length === 0
    ) {
      const from = format(dateRange.from!, "yyyy-MM-dd");
      const to = format(dateRange.to!, "yyyy-MM-dd");
      startTransition(async () => {
        await fetchBroadcast(from, to, 0, broadcastView);
      });
    }
  }

  function handleBroadcastViewChange(view: BroadcastView) {
    setBroadcastView(view);
    const from = format(dateRange.from!, "yyyy-MM-dd");
    const to = format(dateRange.to!, "yyyy-MM-dd");

    if (view === "tournament") {
      if (festival && tournamentData.length === 0) {
        startTransition(async () => {
          await fetchBroadcast(
            from,
            to,
            0,
            "broadcast",
            false,
            festivalChannelIds,
          );
        });
      }
      return;
    }

    startTransition(async () => {
      await fetchBroadcast(from, to, 0, view);
    });
  }

  function handleLoadMore() {
    const from = format(dateRange.from!, "yyyy-MM-dd");
    const to = format(dateRange.to!, "yyyy-MM-dd");
    const isTournamentView = broadcastView === "tournament";
    startLoadingMore(async () => {
      await fetchBroadcast(
        from,
        to,
        isTournamentView ? tournamentData.length : broadcastData.length,
        isTournamentView ? "broadcast" : broadcastView,
        true,
        isTournamentView ? festivalChannelIds : undefined,
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
        {active === "broadcast" && (
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

      {active === "broadcast" ? (
        <div className="space-y-3">
          {/* 방송시간순/평균시청자순/대회(있으면) 선택 — 눈에 잘 띄게 필박스 형태로 */}
          <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
            {broadcastViewTabs.map((tab) => {
              const isActive = broadcastView === tab.key;
              const isTournamentTab = tab.key === "tournament";
              return (
                <button
                  key={tab.key}
                  onClick={() => handleBroadcastViewChange(tab.key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? isTournamentTab
                        ? "bg-amber-400 text-amber-950 shadow-sm"
                        : "bg-primary text-primary-foreground shadow-sm"
                      : isTournamentTab
                        ? "text-amber-500 hover:text-amber-400"
                        : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {broadcastView === "tournament" && festival ? (
            (() => {
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
                        {[...team.members]
                          .sort(
                            (a, b) =>
                              ROLE_DISPLAY_ORDER.indexOf(a.role) -
                              ROLE_DISPLAY_ORDER.indexOf(b.role),
                          )
                          .map((member) => {
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
                                    <span
                                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${roleBadgeStyle[member.role]}`}
                                    >
                                      {member.role}
                                    </span>
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
            })()
          ) : (
            <>
              {isPending && deferredData.length === 0 ? (
                <p className="text-sm text-muted-foreground">로딩 중...</p>
              ) : deferredData.length === 0 ? (
                <p className="text-sm text-muted-foreground">데이터 없음</p>
              ) : (
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
              )}
            </>
          )}
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
