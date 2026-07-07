// scripts/inspect-dates.ts
import { prisma } from "@/lib/prisma";

async function main() {
  const categoryId = process.argv[2];
  if (!categoryId) {
    console.error("사용법: npx tsx scripts/inspect-dates.ts <categoryId>");
    process.exit(1);
  }

  const rows = await prisma.dailySummary.findMany({
    where: { liveCategory: categoryId },
    orderBy: { date: "asc" },
  });

  console.log(`총 ${rows.length}개 row\n`);
  for (const r of rows) {
    console.log(
      `raw: ${r.date.toISOString()}  |  MM-DD: ${r.date
        .toISOString()
        .slice(
          5,
          10,
        )}  |  snapshotCount: ${r.snapshotCount}  |  broadcastCount: ${r.broadcastCount}  |  totalViewers: ${r.totalViewers}`,
    );
  }

  await prisma.$disconnect();
}

main();
