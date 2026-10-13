import {
  getPartnerStreamers,
  getMCNStreamers,
  getGroupStreamers,
} from "@/lib/streamers";
import { getMonthWeekOptions, toSummaryDateRange } from "@/lib/utils";
import { getStreamerRanking } from "@/lib/streamerStats";
import { StreamersClient } from "@/components/streamer/StreamersClient";
import { MCN_KEYS } from "@/lib/data/mcn";
import { GROUP_KEYS } from "@/lib/data/groups";
import { type Streamer } from "@/lib/streamers";
import { connection } from "next/server";

export default async function StreamersPage() {
  await connection();

  const [partnerStreamers, ...rest] = await Promise.all([
    getPartnerStreamers(),
    ...MCN_KEYS.map((key) => getMCNStreamers(key)),
    ...GROUP_KEYS.map((key) => getGroupStreamers(key)),
  ]);

  const mcnStreamers = Object.fromEntries(
    MCN_KEYS.map((key, i) => [key, rest[i]]),
  ) as Record<string, Streamer[]>;

  const groupStreamers = Object.fromEntries(
    GROUP_KEYS.map((key, i) => [key, rest[MCN_KEYS.length + i]]),
  ) as Record<string, Streamer[]>;

  const groups = getMonthWeekOptions();
  const initialMonthIndex = groups.length - 1;
  const initialWeekIndex = groups[initialMonthIndex].weeks.length - 1;
  const initialWeek = groups[initialMonthIndex].weeks[initialWeekIndex];

  // StreamerDailySummary.date는 "영업일의 KST 00:00"으로 저장되어 있으므로
  // 06:00 기준 주차 경계를 요약 테이블 조회용으로 6시간 당겨서 사용
  const range = toSummaryDateRange(initialWeek.from, initialWeek.to);
  const initialRankingStreamers = await getStreamerRanking(
    range.from,
    range.to,
    true, // excludeBroadcast 기본값
  );

  const rankingGroups = groups.map((g) => ({
    label: g.label,
    weeks: g.weeks.map((w) => ({ label: w.label })),
  }));

  return (
    <div className="p-4 md:p-8 space-y-4">
      <StreamersClient
        partnerStreamers={partnerStreamers}
        mcnStreamers={mcnStreamers}
        groupStreamers={groupStreamers}
        rankingGroups={rankingGroups}
        initialMonthIndex={initialMonthIndex}
        initialWeekIndex={initialWeekIndex}
        initialRankingStreamers={initialRankingStreamers}
      />
    </div>
  );
}
