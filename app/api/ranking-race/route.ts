import { NextRequest } from "next/server";
import {
  getRankingRace,
  type Granularity,
  type Entity,
  type Metric,
} from "@/lib/rankingRace";

const ALLOWED_GRANULARITY: Granularity[] = [
  "day",
  "week",
  "month",
  "quarter",
  "year",
];
const ALLOWED_ENTITY: Entity[] = ["game", "streamer"];
const ALLOWED_METRIC: Metric[] = ["avgViewers", "maxViewers"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityParam = searchParams.get("entity") ?? "game";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const granularityParam = searchParams.get("granularity") ?? "quarter";
  const metricParam = searchParams.get("metric") ?? "avgViewers";
  const topN = Number(searchParams.get("topN") ?? 15);

  if (!from || !to) {
    return Response.json(
      { error: "from, to 파라미터가 필요합니다." },
      { status: 400 },
    );
  }
  if (!ALLOWED_ENTITY.includes(entityParam as Entity)) {
    return Response.json(
      { error: "entity 값이 올바르지 않습니다." },
      { status: 400 },
    );
  }
  if (!ALLOWED_GRANULARITY.includes(granularityParam as Granularity)) {
    return Response.json(
      { error: "granularity 값이 올바르지 않습니다." },
      { status: 400 },
    );
  }
  if (!ALLOWED_METRIC.includes(metricParam as Metric)) {
    return Response.json(
      { error: "metric 값이 올바르지 않습니다." },
      { status: 400 },
    );
  }
  if (from > to) {
    return Response.json(
      { error: "시작일이 종료일보다 늦을 수 없습니다." },
      { status: 400 },
    );
  }

  const includeTournamentsParam =
    searchParams.get("includeTournaments") === "true";

  const data = await getRankingRace(entityParam as Entity, {
    from,
    to,
    granularity: granularityParam as Granularity,
    metric: metricParam as Metric,
    topN: Number.isFinite(topN) ? topN : 15,
    includeTournaments: includeTournamentsParam,
  });

  return Response.json(data);
}
