"use client";

import { useRef, useState, useTransition } from "react";
import { StreamerSearch } from "@/components/streamer/StreamerSearch";
import { StreamerRankingList } from "@/components/streamer/StreamerRankingList";
import { MonthWeekFilterTab } from "../ui/month-week-tab";
import { StreamerRankingEntry } from "@/lib/streamerStats";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

type MonthGroup = { label: string; weeks: { label: string }[] };

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

const cacheKey = (m: number, w: number, exclude: boolean) =>
  `${m}-${w}-${exclude ? 1 : 0}`;

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

  // 한 번 받은 결과를 기억 (key: "월-주-중계제외")
  const cacheRef = useRef(
    new Map<string, StreamerRankingEntry[]>([
      [
        cacheKey(initialMonthIndex, initialWeekIndex, true),
        initialRankingStreamers,
      ],
    ]),
  );
  // 마지막으로 요청한 key. 늦게 도착한 이전 응답이 화면을 덮지 않게 함
  const latestKeyRef = useRef("");

  function fetchRanking(m: number, w: number, exclude: boolean) {
    const key = cacheKey(m, w, exclude);
    latestKeyRef.current = key;

    // 이미 받은 조건이면 요청 없이 바로 표시
    const cached = cacheRef.current.get(key);
    if (cached) {
      setRankingStreamers(cached);
      return;
    }

    startTransition(async () => {
      const res = await fetch(
        `/api/streamer-ranking?month=${m}&week=${w}&excludeBroadcast=${exclude}`,
      );
      if (!res.ok) return;
      const json = await res.json();
      cacheRef.current.set(key, json.streamers);

      // 그사이 다른 조건을 눌렀으면 화면에는 반영하지 않음 (캐시에만 저장)
      if (latestKeyRef.current === key) setRankingStreamers(json.streamers);
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

        <div className="relative">
          {/* 로딩 중에도 목록을 유지해서 정렬 상태가 날아가지 않게 함 */}
          <div
            className={`transition-opacity ${isPending ? "pointer-events-none opacity-30" : ""}`}
            aria-busy={isPending}
          >
            <StreamerRankingList streamers={rankingStreamers} />
          </div>

          {/* 스크롤 위치와 관계없이 보이도록 화면 위쪽에 붙는 스피너 */}
          {isPending && (
            <div className="pointer-events-none absolute inset-0 z-10">
              <div className="sticky top-1/3 flex justify-center pt-16">
                <LoadingSpinner size={36} label="불러오는 중..." />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
