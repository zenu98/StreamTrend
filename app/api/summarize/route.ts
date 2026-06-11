import { summarizeYesterday } from "@/lib/summarize";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date"); // ex) ?date=2026-06-05

  const targetDate = dateParam ? new Date(dateParam) : undefined;
  const result = await summarizeYesterday(targetDate);
  return Response.json(result);
}
