import { prisma } from "@/lib/prisma";
import { unstable_cache as nextCache } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";

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
        GROUP BY "channelId", "channelName", "channelImageUrl"
        ORDER BY ${orderClause} DESC
        LIMIT 20
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
    [`game-broadcast-rank-${categoryId}-${from}-${to}-${skip}-${orderBy}`],
    { tags: ["broadcast-rank"], revalidate: 86400 },
  );

  const data = await getData();
  return Response.json(data);
}
