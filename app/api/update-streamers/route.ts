// app/api/update-streamers/route.ts
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const streamers = await prisma.streamer.findMany({
    select: { channelId: true },
  });

  let updated = 0;
  let failed = 0;

  const batchSize = 20; // 채널 API 최대 20개
  for (let i = 0; i < streamers.length; i += batchSize) {
    const batch = streamers.slice(i, i + batchSize);
    const ids = batch.map((s) => s.channelId);

    const res = await fetch(
      `https://openapi.chzzk.naver.com/open/v1/channels?${ids.map((id) => `channelIds=${id}`).join("&")}`,
      {
        headers: {
          "Client-Id": process.env.CHZZK_CLIENT_ID!,
          "Client-Secret": process.env.CHZZK_CLIENT_SECRET!,
        },
      },
    );
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
  }

  return Response.json({ success: true, updated, failed });
}
