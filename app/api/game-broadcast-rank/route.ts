import { prisma } from "@/lib/prisma";
import { unstable_cache as nextCache } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";

const PAGE_SIZE = 20;

type Row = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  totalBroadcast: bigint;
  avgViewers: bigint;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const skip = parseInt(searchParams.get("skip") ?? "0");
  const orderBy = searchParams.get("orderBy") ?? "broadcast";
  // 콤마로 구분된 channelId 목록. 있으면 이 채널들만 필터링(대회 참가자 명단 등).
  const channelIdsParam = searchParams.get("channelIds");
  const channelIds = channelIdsParam
    ? channelIdsParam.split(",").filter(Boolean)
    : null;

  if (!categoryId || !from || !to) {
    return Response.json({ error: "missing params" }, { status: 400 });
  }

  const fromDate = new Date(`${from}T00:00:00+09:00`);
  const toDate = new Date(`${to}T00:00:00+09:00`);
  toDate.setDate(toDate.getDate() + 1);

  const getData = nextCache(
    async () => {
      const orderClause =
        orderBy === "avgViewers"
          ? Prisma.sql`"avgViewers"`
          : Prisma.sql`"totalBroadcast"`;

      const channelFilter =
        channelIds && channelIds.length > 0
          ? Prisma.sql`AND "channelId" IN (${Prisma.join(channelIds)})`
          : Prisma.empty;

      // channelIds로 특정 인원만 필터링하는 경우(대회 참가자 등)엔 그 인원 수만큼
      // LIMIT을 늘려서, 원래의 20명 제한 때문에 일부가 잘려나가지 않게 한다.
      const limit =
        channelIds && channelIds.length > 0
          ? Math.max(channelIds.length, PAGE_SIZE)
          : PAGE_SIZE;

      const rows = await prisma.$queryRaw<Row[]>`
        SELECT
          "channelId",
          "channelName",
          "channelImageUrl",
          SUM("broadcastCount") AS "totalBroadcast",
          CASE
            WHEN SUM("broadcastCount") > 0
            THEN ROUND(SUM("totalViewers")::numeric / SUM("broadcastCount"))
            ELSE 0
          END AS "avgViewers"
        FROM "StreamerDailySummary"
        WHERE "liveCategory" = ${categoryId}
          AND "date" >= ${fromDate}
          AND "date" < ${toDate}
          ${channelFilter}
        GROUP BY "channelId", "channelName", "channelImageUrl"
        ORDER BY ${orderClause} DESC
        LIMIT ${limit}
        OFFSET ${skip}
      `;

      return rows.map((r) => ({
        channelId: r.channelId,
        channelName: r.channelName,
        channelImageUrl: r.channelImageUrl ?? null,
        broadcastCount: Number(r.totalBroadcast),
        avgViewers: Number(r.avgViewers),
      }));
    },
    [
      `game-broadcast-rank-${categoryId}-${from}-${to}-${skip}-${orderBy}-${channelIdsParam ?? "all"}`,
    ],
    { tags: ["broadcast-rank"], revalidate: 86400 },
  );

  const data = await getData();
  return Response.json(data);
}
