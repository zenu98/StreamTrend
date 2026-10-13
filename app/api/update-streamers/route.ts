import { prisma } from "@/lib/prisma";
import { getTodayBusinessBoundary } from "@/lib/utils";

const CONCURRENCY = 8;
const BATCH_SIZE = 20;

async function processBatch(ids: string[]) {
  let updated = 0;
  let failed = 0;

  const res = await fetch(
    `https://openapi.chzzk.naver.com/open/v1/channels?${ids.map((id) => `channelIds=${id}`).join("&")}`,
    {
      headers: {
        "Client-Id": process.env.CHZZK_CLIENT_ID!,
        "Client-Secret": process.env.CHZZK_CLIENT_SECRET!,
      },
    },
  );

  if (!res.ok) {
    return { updated: 0, failed: ids.length };
  }

  const json = await res.json();
  const data = json.content?.data ?? [];

  await Promise.all(
    data.map(async (ch: any) => {
      try {
        await prisma.streamer.update({
          where: { channelId: ch.channelId },
          data: {
            followerCount: ch.followerCount ?? 0,
            verifiedMark: ch.verifiedMark ?? false,
          },
        });
        updated++;
      } catch {
        failed++;
      }
    }),
  );

  return { updated, failed };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // "오늘"을 계산하지 않고, 테이블에 실제로 있는 가장 최근 날짜를 그대로 사용
  const latest = await prisma.streamerDailySummary.findFirst({
    orderBy: { date: "desc" },
    select: { date: true },
  });

  if (!latest) {
    return Response.json({
      success: true,
      totalTarget: 0,
      updated: 0,
      failed: 0,
    });
  }

  const latestChannels = await prisma.streamerDailySummary.findMany({
    where: { date: latest.date },
    select: { channelId: true },
    distinct: ["channelId"],
  });

  const ids = latestChannels.map((r) => r.channelId);

  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    batches.push(ids.slice(i, i + BATCH_SIZE));
  }

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const chunk = batches.slice(i, i + CONCURRENCY);
    const results = await Promise.all(chunk.map(processBatch));
    for (const r of results) {
      updated += r.updated;
      failed += r.failed;
    }
  }

  return Response.json({
    success: true,
    latestDate: latest.date,
    totalTarget: ids.length,
    totalBatches: batches.length,
    updated,
    failed,
  });
}
