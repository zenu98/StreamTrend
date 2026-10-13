import { getMonthWeekOptions, toSummaryDateRange } from "@/lib/utils";
import { getGameRanking } from "@/lib/gameStats";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monthIndexRaw = Number(searchParams.get("month") ?? "0");
  const weekIndexRaw = Number(searchParams.get("week") ?? "0");
  const limitRaw = Number(searchParams.get("limit") ?? "100");

  const groups = getMonthWeekOptions();
  const monthIndex =
    Number.isInteger(monthIndexRaw) &&
    monthIndexRaw >= 0 &&
    monthIndexRaw < groups.length
      ? monthIndexRaw
      : groups.length - 1; // 기본값: 가장 최근 달

  const group = groups[monthIndex];
  const weekIndex =
    Number.isInteger(weekIndexRaw) &&
    weekIndexRaw >= 0 &&
    weekIndexRaw < group.weeks.length
      ? weekIndexRaw
      : group.weeks.length - 1; // 기본값: 그 달의 마지막 주

  const week = group.weeks[weekIndex];
  const limit = [100, 200].includes(limitRaw) ? limitRaw : 100;

  // DailySummary.date는 "영업일의 KST 00:00"으로 저장되어 있으므로
  // 06:00 기준 주차 경계를 요약 테이블 조회용으로 6시간 당겨서 사용
  const range = toSummaryDateRange(week.from, week.to);
  const games = await getGameRanking(range.from, range.to, limit);

  return Response.json({
    monthLabel: group.label,
    weekLabel: week.label,
    games,
  });
}
