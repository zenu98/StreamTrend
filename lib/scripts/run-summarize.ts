import { summarizeYesterday } from "../summarize";
import { prisma } from "../prisma";
async function main() {
  const dbCheck = await prisma.$queryRaw`
  SELECT date, COUNT(*)::int AS cnt FROM "DailySummary"
  GROUP BY date ORDER BY date DESC LIMIT 5
`;
  console.log(dbCheck);
  const fromArg = process.argv[2];
  const toArg = process.argv[3];

  if (fromArg && toArg) {
    // from/to 직접 지정 모드
    const from = new Date(fromArg);
    const to = new Date(toArg);
    console.log(`from: ${from.toISOString()}`);
    console.log(`to: ${to.toISOString()}`);
    const start = Date.now();
    const result = await summarizeYesterday(undefined, from, to);
    console.log(`완료 (${((Date.now() - start) / 1000).toFixed(1)}초)`);
    console.log(result);
  } else if (fromArg) {
    // 기존 날짜 모드
    console.log(`시작: ${fromArg}`);
    const start = Date.now();
    const result = await summarizeYesterday(new Date(fromArg));
    console.log(`완료 (${((Date.now() - start) / 1000).toFixed(1)}초)`);
    console.log(result);
  } else {
    console.error(
      "사용법: npx tsx --env-file=.env.local scripts/run-summarize.ts 2026-07-07",
    );
    console.error(
      "또는:  npx tsx --env-file=.env.local scripts/run-summarize.ts 2026-07-20T21:00:00.000Z 2026-07-21T21:00:00.000Z",
    );
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
