import { getTopStreamersTrend } from "@/lib/topStreamerTrend";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topN = Number(searchParams.get("topN") ?? 5);

  const data = await getTopStreamersTrend(Number.isFinite(topN) ? topN : 5);
  return Response.json(data);
}
