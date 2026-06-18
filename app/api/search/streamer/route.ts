import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  if (!query.trim()) {
    return Response.json({ streamers: [] });
  }

  // 검색어로 스트리머 찾기
  const rows = await prisma.streamer.findMany({
    where: {
      channelName: { contains: query, mode: "insensitive" },
    },
    distinct: ["channelId"],
    select: {
      channelId: true,
      channelName: true,
      channelImageUrl: true,
    },
    take: 20,
  });

  return Response.json({ results: rows });
}
