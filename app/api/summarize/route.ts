import { summarizeYesterday } from "@/lib/summarize";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date"); // ex) ?date=2026-06-05

  const targetDate = dateParam ? new Date(dateParam) : undefined;
  const result = await summarizeYesterday(targetDate);
  return Response.json(result);
}
