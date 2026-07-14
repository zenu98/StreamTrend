"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { StreamerTopRecordEntry } from "@/lib/streamerStats";
import { UnderlineTabs } from "@/components/shared/UnderlineTabs";

type Props = {
  topRecords: StreamerTopRecordEntry[];
  topGames: StreamerTopRecordEntry[];
};

const tabs = [
  { label: "전체 기록", key: "records" as const },
  { label: "게임별 최고", key: "games" as const },
];

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

export function StreamerTopRecords({ topRecords, topGames }: Props) {
  const [active, setActive] = useState<"records" | "games">("records");
  const list = active === "records" ? topRecords : topGames;

  return (
    <div className="space-y-4">
      <h2 className="text-lg md:text-xl font-bold">역대 최고 시청자 기록</h2>

      <UnderlineTabs options={tabs} active={active} onChange={setActive} />

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">데이터 없음</p>
      ) : (
        <div className="divide-y rounded-lg border bg-card">
          {list.map((entry, i) => (
            <Link
              key={`${entry.liveCategory}-${i}`}
              href={`/games/${encodeURIComponent(entry.liveCategory)}`}
              className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50 md:gap-4 md:p-4"
            >
              <RankBadge rank={i + 1} />

              {entry.posterImageUrl ? (
                <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded">
                  <Image
                    src={entry.posterImageUrl}
                    alt={entry.liveCategoryValue}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <div className="h-14 w-10 shrink-0 rounded bg-muted" />
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {entry.liveCategoryValue}
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
