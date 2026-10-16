import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { getMonthWeekOptions, toSummaryDateRange } from "@/lib/utils";
import { getStreamerRanking } from "@/lib/streamerStats";
import { StreamersClient } from "@/components/streamer/StreamersClient";

export default function StreamersPage() {
  return (
    <div className="p-4 md:p-8 space-y-4">
      <Suspense
        fallback={<div className="text-muted-foreground">로딩 중...</div>}
      >
        <StreamersContent />
      </Suspense>
    </div>
  );
}

async function StreamersContent() {
  const data = await getInitialStreamerRankingData();
  return <StreamersClient {...data} />;
}

// 현재 시각(getMonthWeekOptions)을 캐시 함수 안에서 읽어서
// connection() 없이 페이지를 미리 렌더링할 수 있게 함
async function getInitialStreamerRankingData() {
  "use cache";
  cacheLife("dailySummary");
  cacheTag("ranking");

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

  return {
    rankingGroups: groups.map((g) => ({
      label: g.label,
      weeks: g.weeks.map((w) => ({ label: w.label })),
    })),
    initialMonthIndex,
    initialWeekIndex,
    initialRankingStreamers,
  };
}
