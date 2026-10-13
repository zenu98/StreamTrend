"use client";

import { useState, useTransition } from "react";
import { StreamerSearch } from "@/components/streamer/StreamerSearch";
import { StreamerRankingList } from "@/components/streamer/StreamerRankingList";
import { MonthWeekFilterTab } from "../ui/month-week-tab";

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
  rankingGroups: MonthGroup[];
  initialMonthIndex: number;
  initialWeekIndex: number;
  initialRankingStreamers: StreamerRankingEntry[];
};

// 다른 파일(StreamerRankingList 등)에서 import할 수 있으니 유지
export function formatCount(n: number): string {
  if (n >= 10000) {
    const man = n / 10000;
    // 정수면 소수점 없이, 아니면 소수점 첫째 자리까지
    return Number.isInteger(man) ? `${man}만` : `${man.toFixed(1)}만`;
  }
  return n.toLocaleString();
}

export function StreamersClient({
  rankingGroups,
  initialMonthIndex,
  initialWeekIndex,
  initialRankingStreamers,
}: Props) {
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

  return (
    <main>
      <div className="mb-5">
        <StreamerSearch />
      </div>

      {/* <div className="space-y-3">
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
      </div> */}
    </main>
  );
}
