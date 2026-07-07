import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("categoryId");
  if (!categoryId) {
    return Response.json(
      { error: "categoryId 쿼리 파라미터 필요" },
      { status: 400 },
    );
  }

  const rows = await prisma.dailySummary.findMany({
    where: { liveCategory: categoryId },
    orderBy: { date: "asc" },
  });

  const result = rows.map((r) => ({
    raw: r.date.toISOString(),
    mmdd: r.date.toISOString().slice(5, 10),
    snapshotCount: r.snapshotCount,
    broadcastCount: r.broadcastCount,
    totalViewers: r.totalViewers,
  }));

  return Response.json({ count: rows.length, rows: result });
}
