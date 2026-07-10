import { summarizeYesterday } from "../summarize";

async function main() {
  const dateArg = process.argv[2];
  if (!dateArg) {
    console.error(
      "사용법: npx tsx --env-file=.env.local scripts/run-summarize.ts 2026-07-07",
    );
    process.exit(1);
  }
  console.log(`시작: ${dateArg}`);
  const start = Date.now();
  const result = await summarizeYesterday(new Date(dateArg));
  console.log(`완료 (${((Date.now() - start) / 1000).toFixed(1)}초)`);
  console.log(result);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
