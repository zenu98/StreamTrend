import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.$queryRaw<{ day: string; count: bigint }[]>`
    SELECT to_char("collectedAt" + interval '9 hours', 'YYYY-MM-DD') as day, COUNT(*) as count
    FROM "LiveSnapshot"
    GROUP BY day
    ORDER BY day ASC
  `;
  const result = rows.map((r) => ({ day: r.day, count: Number(r.count) }));
  const total = result.reduce((sum, r) => sum + r.count, 0);
  return Response.json({
    totalRows: total,
    dayCount: result.length,
    rows: result,
  });
}
