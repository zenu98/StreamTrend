import { getStats } from "@/lib/stats";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") ?? "daily") as
    | "daily"
    | "weekly"
    | "monthly";

  const result = await getStats(period);
  return Response.json({ period, ...result });
}
