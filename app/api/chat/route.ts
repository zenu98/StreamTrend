import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  collectOneReplay,
  getTopStreamers,
  resetChzzkFailures,
  ChzzkBlockedError,
} from "@/lib/chatStats";

export const maxDuration = 300;

const SKIP_WITHIN_MS = 20 * 60 * 60 * 1000; // 20시간 내 수집했으면 skip
const MAX_PER_RUN = 10; // 1회 실행당 최대 수집 인원
const TIME_BUDGET_MS = 240_000; // 4분 넘으면 다음 사람 시작 안 함

export async function GET(request: NextRequest) {
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const limitParam = Number(params.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 50;
  const offset = Math.max(0, Number(params.get("offset")) || 0);
  const force = params.get("force") === "1";

  const top = (await getTopStreamers(limit + offset)).slice(offset);

  // 최근 20시간 내 수집된 채널
  const recent = force
    ? []
    : await prisma.videoChatStat.findMany({
        where: {
          channelId: { in: top.map((s) => s.channelId) },
          sampledAt: { gte: new Date(Date.now() - SKIP_WITHIN_MS) },
        },
        select: { channelId: true },
        distinct: ["channelId"],
      });
  const recentSet = new Set(recent.map((r) => r.channelId));

  resetChzzkFailures();
  const startedAt = Date.now();
  let attempted = 0;
  let collected = 0;
  let blocked = false;
  const results: { channelName: string; status: string; error?: string }[] = [];

  for (const s of top) {
    if (blocked) {
      results.push({ channelName: s.channelName, status: "aborted" });
      continue;
    }
    if (recentSet.has(s.channelId)) {
      results.push({ channelName: s.channelName, status: "skipped" });
      continue;
    }
    if (attempted >= MAX_PER_RUN || Date.now() - startedAt > TIME_BUDGET_MS) {
      results.push({ channelName: s.channelName, status: "deferred" });
      continue;
    }
    attempted++;

    try {
      const ok = await collectOneReplay(s.channelId, s.channelName);
      if (ok) collected++;
      results.push({
        channelName: s.channelName,
        status: ok ? "collected" : "no-new-replay",
      });
    } catch (e: any) {
      if (e instanceof ChzzkBlockedError) {
        blocked = true;
        console.error("[collect-chat] 차단 의심으로 중단");
      } else {
        console.error("[collect-chat]", s.channelName, e);
      }
      results.push({
        channelName: s.channelName,
        status: "error",
        error: String(e?.cause?.code ?? e?.message ?? e),
      });
    }
  }

  return Response.json({
    collected,
    attempted,
    total: top.length,
    blocked,
    elapsedSec: Math.round((Date.now() - startedAt) / 1000),
    results,
  });
}
