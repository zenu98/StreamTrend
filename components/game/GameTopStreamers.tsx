"use client";

import { useState, useTransition, useDeferredValue } from "react";
import Image from "next/image";
import Link from "next/link";
import { DateRange } from "react-day-picker";
import { format, subDays } from "date-fns";
import type { TopStreamerEntry } from "@/lib/gameStats";
import { UnderlineTabs } from "@/components/shared/UnderlineTabs";
import { DateFilterTab } from "../ui/date-filter-tab";
import { formatDuration } from "@/lib/utils";
import { Info } from "lucide-react";

type Props = {
  topRecords: TopStreamerEntry[];
  topChannels: TopStreamerEntry[];
  categoryId: string;
};

type BroadcastEntry = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  broadcastCount: number;
  avgViewers: number;
};

type SortKey = "broadcast" | "avgViewers";

const tabs = [
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

export function GameTopStreamers({
  topRecords,
  topChannels,
  categoryId,
}: Props) {
  const [active, setActive] = useState<"records" | "channels" | "broadcast">(
    "channels",
  );
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [dayCount, setDayCount] = useState<number | null>(7);
  const [broadcastData, setBroadcastData] = useState<BroadcastEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("broadcast");
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, startLoadingMore] = useTransition();
  const deferredData = useDeferredValue<BroadcastEntry[]>(broadcastData);
  const isStale = broadcastData !== deferredData;
  const list = active === "records" ? topRecords : topChannels;

  async function fetchBroadcast(
    from: string,
    to: string,
    skip: number,
    sort: SortKey,
    append = false,
  ) {
    const res = await fetch(
      `/api/game-broadcast-rank?categoryId=${categoryId}&from=${from}&to=${to}&skip=${skip}&orderBy=${sort}`,
    );
    const data: BroadcastEntry[] = await res.json();
    if (append) {
      setBroadcastData((prev) => [...prev, ...data]);
    } else {
      setBroadcastData(data);
    }
    setHasMore(data.length === PAGE_SIZE);
  }

  function handleDateChange(range: DateRange, days: number | null) {
    setDateRange(range);
    setDayCount(days);
    const from = format(range.from!, "yyyy-MM-dd");
    const to = format(range.to!, "yyyy-MM-dd");
    startTransition(async () => {
      await fetchBroadcast(from, to, 0, sortKey);
    });
  }

  function handleTabChange(key: "records" | "channels" | "broadcast") {
    setActive(key);
    if (key === "broadcast" && broadcastData.length === 0) {
      const from = format(dateRange.from!, "yyyy-MM-dd");
      const to = format(dateRange.to!, "yyyy-MM-dd");
      startTransition(async () => {
        await fetchBroadcast(from, to, 0, sortKey);
      });
    }
  }

  function handleSortChange(sort: SortKey) {
    setSortKey(sort);
    const from = format(dateRange.from!, "yyyy-MM-dd");
    const to = format(dateRange.to!, "yyyy-MM-dd");
    startTransition(async () => {
      await fetchBroadcast(from, to, 0, sort);
    });
  }

  function handleLoadMore() {
    const from = format(dateRange.from!, "yyyy-MM-dd");
    const to = format(dateRange.to!, "yyyy-MM-dd");
    startLoadingMore(async () => {
      await fetchBroadcast(from, to, broadcastData.length, sortKey, true);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg md:text-xl font-bold">스트리머 기록</h2>
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
      </div>

      {active === "broadcast" ? (
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
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">데이터 없음</p>
      ) : (
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
      )}
    </div>
  );
}
