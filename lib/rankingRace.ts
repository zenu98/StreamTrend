import { prisma } from "@/lib/prisma";
import { BROADCAST_CHANNEL_IDS } from "./data/channel"; // 실제 경로에 맞게 조정

export type Granularity = "day" | "week" | "month" | "quarter" | "year";
export type Entity = "game" | "streamer";
export type Metric = "avgViewers" | "maxViewers";

export type RaceEntry = {
  id: string;
  name: string;
  imageUrl: string | null;
  value: number;
  category?: string;
  liveTitle?: string;
};

export type RaceFrame = {
  period: string;
  entries: RaceEntry[];
};

type Params = {
  from: string;
  to: string;
  granularity: Granularity;
  metric?: Metric;
  topN?: number;
  includeTournaments?: boolean;
};

const METRIC_AGG: Record<Metric, "SUM" | "MAX"> = {
  avgViewers: "SUM",
  maxViewers: "MAX",
};

const GRANULARITY_EXPR: Record<Granularity, string> = {
  day: `to_char(date, 'YYYY-MM-DD')`,
  week: `to_char(date_trunc('week', date), 'YYYY-MM-DD') || ' 주'`,
  month: `to_char(date, 'YYYY-MM')`,
  quarter: `to_char(date, 'YYYY') || '-Q' || ceil(extract(month from date)::numeric / 3)`,
  year: `to_char(date, 'YYYY')`,
};

type CategoryInfo = { category: string; liveTitle: string };

function buildFrames(
  rows: { period: string; key: string; score: number }[],
  lookup: Map<string, { name: string; imageUrl: string | null }>,
  categoryLookup: Map<string, CategoryInfo> | null,
  topN: number,
): RaceFrame[] {
  const byPeriod = new Map<string, RaceEntry[]>();

  for (const row of rows) {
    const info = lookup.get(row.key);
    if (!info) continue;

    const categoryKey = `${row.period}::${row.key}`;
    const categoryInfo = categoryLookup?.get(categoryKey);

    const entry: RaceEntry = {
      id: row.key,
      name: info.name,
      imageUrl: info.imageUrl,
      value: row.score,
      category: categoryInfo?.category,
      liveTitle: categoryInfo?.liveTitle,
    };
    const list = byPeriod.get(row.period) ?? [];
    list.push(entry);
    byPeriod.set(row.period, list);
  }

  return [...byPeriod.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, entries]) => ({
      period,
      entries: entries.sort((a, b) => b.value - a.value).slice(0, topN),
    }));
}

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

  return buildFrames(
    rows.map((r) => ({
      period: r.period,
      key: r.liveCategory,
      score: r.score,
    })),
    lookup,
    null, // 게임 레이스는 카테고리/제목 불필요
    topN,
  );
}

export async function getStreamerRankingRace({
  from,
  to,
  granularity,
  metric = "avgViewers",
  topN = 15,
  includeTournaments = false,
}: Params): Promise<RaceFrame[]> {
  const periodExpr = GRANULARITY_EXPR[granularity];

  // avgViewers: 방송 횟수(틱 수)로 가중평균 -> 카테고리를 여러 개 탄 날에도 왜곡 없음
  // maxViewers: 그대로 최댓값
  const scoreExpr =
    metric === "avgViewers"
      ? `SUM("totalViewers")::float / NULLIF(SUM("broadcastCount"), 0)`
      : `MAX("maxViewers")::float`;

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
          ${scoreExpr} AS score,
          ROW_NUMBER() OVER (
            PARTITION BY ${periodExpr}
            ORDER BY ${scoreExpr} DESC
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

  const channelIds = [...new Set(rows.map((r) => r.channelId))];
  const streamers = await prisma.streamer.findMany({
    where: { channelId: { in: channelIds } },
    select: { channelId: true, channelName: true, channelImageUrl: true },
  });
  const lookup = new Map(
    streamers.map((s) => [
      s.channelId,
      { name: s.channelName, imageUrl: s.channelImageUrl },
    ]),
  );

  // (period, channelId) 조합별로, 그 기간 안에서 시청자가 가장 많았던 카테고리/방송제목
  // DISTINCT ON은 period가 day가 아닌 경우(week/month 등) 하루 단위로 여러 행이 뭉치므로
  // 그 기간 전체에서 totalViewers가 가장 큰 행 하나를 대표로 뽑음.
  const categoryRows = await prisma.$queryRawUnsafe<
    { period: string; channelId: string; category: string; liveTitle: string }[]
  >(
    `
      SELECT DISTINCT ON (${periodExpr}, "channelId")
        ${periodExpr} AS period,
        "channelId",
        "liveCategoryValue" AS category,
        "liveTitle"
      FROM "StreamerDailySummary"
      WHERE "channelId" = ANY($1::text[])
        AND date >= $2::date
        AND date < ($3::date + interval '1 day')
      ORDER BY ${periodExpr}, "channelId", "totalViewers" DESC
    `,
    channelIds,
    from,
    to,
  );

  const categoryLookup = new Map<string, CategoryInfo>(
    categoryRows.map((r) => [
      `${r.period}::${r.channelId}`,
      { category: r.category, liveTitle: r.liveTitle },
    ]),
  );

  return buildFrames(
    rows.map((r) => ({ period: r.period, key: r.channelId, score: r.score })),
    lookup,
    categoryLookup,
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
