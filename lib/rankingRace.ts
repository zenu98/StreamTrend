import { prisma } from "@/lib/prisma";
import { BROADCAST_CHANNEL_IDS } from "./data/channel";

export type Granularity = "day" | "week" | "month" | "quarter" | "year";
export type Entity = "game" | "streamer";
export type Metric = "avgViewers" | "maxViewers";

export type RaceEntry = {
  id: string;
  name: string;
  imageUrl: string | null;
  value: number;
};

export type RaceFrame = {
  period: string; // 예: "2025-Q1", "2025-03", "2025-03-10 주", "2025"
  entries: RaceEntry[]; // 점수 내림차순, 상위 N개
};

type Params = {
  from: string; // 'YYYY-MM-DD'
  to: string; // 'YYYY-MM-DD'
  granularity: Granularity;
  metric?: Metric;
  topN?: number;
  includeTournaments?: boolean;
};

// 지표별로 구간을 어떻게 뭉칠지: avgViewers는 하루하루를 더하는 게 자연스럽고(총량 개념),
// maxViewers는 더하면 의미가 이상해져서 구간 내 최댓값(MAX) 하나만 뽑음.
const METRIC_AGG: Record<Metric, "SUM" | "MAX"> = {
  avgViewers: "SUM",
  maxViewers: "MAX",
};

// granularity별 기간 라벨 SQL. 고정 맵에서만 선택되므로 SQL 인젝션 걱정 없음.
// date가 DateTime(06:00 기준 하루 단위) 컬럼이라 별도 캐스팅 없이 바로 씀.
const GRANULARITY_EXPR: Record<Granularity, string> = {
  day: `to_char(date, 'YYYY-MM-DD')`,
  week: `to_char(date_trunc('week', date), 'YYYY-MM-DD') || ' 주'`,
  month: `to_char(date, 'YYYY-MM')`,
  quarter: `to_char(date, 'YYYY') || '-Q' || ceil(extract(month from date)::numeric / 3)`,
  year: `to_char(date, 'YYYY')`,
};

function buildFrames(
  rows: { period: string; key: string; score: number }[],
  lookup: Map<string, { name: string; imageUrl: string | null }>,
  topN: number,
): RaceFrame[] {
  const byPeriod = new Map<string, RaceEntry[]>();

  for (const row of rows) {
    const info = lookup.get(row.key);
    if (!info) continue; // 아직 이름/이미지 정보가 없는 경우 스킵

    const entry: RaceEntry = {
      id: row.key,
      name: info.name,
      imageUrl: info.imageUrl,
      value: row.score,
    };
    const list = byPeriod.get(row.period) ?? [];
    list.push(entry);
    byPeriod.set(row.period, list);
  }

  return [...byPeriod.entries()]
    .sort(([a], [b]) => a.localeCompare(b)) // 기간 오름차순
    .map(([period, entries]) => ({
      period,
      entries: entries.sort((a, b) => b.value - a.value).slice(0, topN),
    }));
}

/** 게임(카테고리)별 분기 랭킹 — 지표(avgViewers/maxViewers) 기준 */
export async function getGameRankingRace({
  from,
  to,
  granularity,
  metric = "avgViewers",
  topN = 15,
}: Params): Promise<RaceFrame[]> {
  const periodExpr = GRANULARITY_EXPR[granularity];
  const aggFn = METRIC_AGG[metric];

  const rows = await prisma.$queryRawUnsafe<
    { period: string; liveCategory: string; score: number }[]
  >(
    `
      WITH ranked AS (
        SELECT
          ${periodExpr} AS period,
          "liveCategory" AS "liveCategory",
          ${aggFn}("${metric}")::float AS score,
          ROW_NUMBER() OVER (
            PARTITION BY ${periodExpr}
            ORDER BY ${aggFn}("${metric}") DESC
          ) AS rn
        FROM "DailySummary"
        WHERE "liveCategory" != ''
          AND "categoryType" = 'GAME'
          AND date >= $1::date
          AND date < ($2::date + interval '1 day')
        GROUP BY period, "liveCategory"
      )
      SELECT period, "liveCategory", score
      FROM ranked
      WHERE rn <= $3
      ORDER BY period ASC, score DESC
    `,
    from,
    to,
    topN,
  );

  if (rows.length === 0) return [];

  const ids = [...new Set(rows.map((r) => r.liveCategory))];
  const categories = await prisma.category.findMany({
    where: { categoryId: { in: ids } },
    select: { categoryId: true, categoryValue: true, posterImageUrl: true },
  });
  const lookup = new Map(
    categories.map((c) => [
      c.categoryId,
      { name: c.categoryValue, imageUrl: c.posterImageUrl },
    ]),
  );

  // DB에서 이미 topN만 걸러왔으니 buildFrames의 slice는 그대로 안전망으로 유지
  return buildFrames(
    rows.map((r) => ({
      period: r.period,
      key: r.liveCategory,
      score: r.score,
    })),
    lookup,
    topN,
  );
}

/**
 * 스트리머별 분기 랭킹 — 지표(avgViewers/maxViewers) 기준.
 * 게임 구분 없이 그 스트리머의 모든 방송을 합산/최댓값 계산함.
 */
export async function getStreamerRankingRace({
  from,
  to,
  granularity,
  metric = "avgViewers",
  topN = 15,
  includeTournaments = false, // 다른 화면과 기본값 통일
}: Params): Promise<RaceFrame[]> {
  const periodExpr = GRANULARITY_EXPR[granularity];
  const aggFn = METRIC_AGG[metric];

  const excludeClause = includeTournaments
    ? ""
    : `AND "channelId" <> ALL($4::text[])`;

  const rows = await prisma.$queryRawUnsafe<
    { period: string; channelId: string; score: number }[]
  >(
    `
      WITH ranked AS (
        SELECT
          ${periodExpr} AS period,
          "channelId" AS "channelId",
          ${aggFn}("${metric}")::float AS score,
          ROW_NUMBER() OVER (
            PARTITION BY ${periodExpr}
            ORDER BY ${aggFn}("${metric}") DESC
          ) AS rn
        FROM "StreamerDailySummary"
        WHERE date >= $1::date
          AND date < ($2::date + interval '1 day')
          ${excludeClause}
        GROUP BY period, "channelId"
      )
      SELECT period, "channelId", score
      FROM ranked
      WHERE rn <= $3
      ORDER BY period ASC, score DESC
    `,
    from,
    to,
    topN,
    ...(includeTournaments ? [] : [[...BROADCAST_CHANNEL_IDS]]),
  );

  if (rows.length === 0) return [];

  const ids = [...new Set(rows.map((r) => r.channelId))];
  const streamers = await prisma.streamer.findMany({
    where: { channelId: { in: ids } },
    select: { channelId: true, channelName: true, channelImageUrl: true },
  });
  const lookup = new Map(
    streamers.map((s) => [
      s.channelId,
      { name: s.channelName, imageUrl: s.channelImageUrl },
    ]),
  );

  return buildFrames(
    rows.map((r) => ({ period: r.period, key: r.channelId, score: r.score })),
    lookup,
    topN,
  );
}

export async function getRankingRace(
  entity: Entity,
  params: Params,
): Promise<RaceFrame[]> {
  return entity === "game"
    ? getGameRankingRace(params)
    : getStreamerRankingRace(params);
}
