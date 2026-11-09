import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";
import { toSummaryDateRange } from "@/lib/utils";
import { BROADCAST_CHANNEL_IDS } from "@/lib/data/channel";

/* ───────────── 치지직 내부 API 요청 ───────────── */

const CHZZK_API = "https://api.chzzk.naver.com/service/v1";
const CHZZK_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Referer: "https://chzzk.naver.com/",
};

export class ChzzkBlockedError extends Error {}

let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;

export function resetChzzkFailures() {
  consecutiveFailures = 0;
}

// 차단 징후(연결 끊김, 403/429/5xx, JSON 아닌 응답)를 감지하고, 연속 실패 시 중단
async function chzzkFetch(url: string): Promise<Response> {
  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    throw new ChzzkBlockedError("연속 실패로 수집 중단");
  }

  const started = Date.now();
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", headers: CHZZK_HEADERS });
  } catch (e: any) {
    consecutiveFailures++;
    console.error("[chzzk BLOCK?] network", e?.cause?.code, url);
    throw e;
  }

  const ms = Date.now() - started;
  if (ms > 5000) console.warn("[chzzk SLOW]", ms, "ms", url);

  if (res.status === 403 || res.status === 429 || res.status >= 500) {
    consecutiveFailures++;
    console.error("[chzzk BLOCK?] status", res.status, url);
    return res;
  }

  const type = res.headers.get("content-type") ?? "";
  if (res.ok && !type.includes("json")) {
    consecutiveFailures++;
    console.error("[chzzk BLOCK?] non-json", type, url);
    return new Response(null, { status: 503 });
  }

  consecutiveFailures = 0; // 정상 응답이면 리셋
  return res;
}

/* ───────────── 수집 ───────────── */

const SAMPLE_POINTS = 8;
const CHAT_PAGE_SIZE = 50;
const DELAY_MS = 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Replay = {
  videoId: string;
  videoNo: number;
  videoTitle: string;
  thumbnailUrl: string | null;
  publishDate: string; // "2026-10-21 14:15:51" (KST)
  durationSec: number;
};

// 채널의 최근 다시보기 목록 (최대 limit개)
async function getRecentReplays(
  channelId: string,
  limit = 10,
): Promise<Replay[]> {
  const url =
    `${CHZZK_API}/channels/${channelId}/videos` +
    `?sortType=LATEST&pagingOptions=${encodeURIComponent(`{"limit":${limit}}`)}`;
  const res = await chzzkFetch(url);
  if (!res.ok) return [];

  const list = (await res.json()).content?.data ?? [];

  return list
    .filter(
      (v: any) =>
        v.videoId && // 비로그인으로 볼 수 없는 제한 영상은 videoId가 null
        v.videoNo &&
        v.videoType === "REPLAY" &&
        v.commentActive &&
        v.duration > 0,
    )
    .map((v: any) => ({
      videoId: v.videoId,
      videoNo: v.videoNo,
      videoTitle: v.videoTitle,
      thumbnailUrl: v.thumbnailImageUrl ?? null,
      publishDate: v.publishDate,
      durationSec: v.duration,
    }));
}

// 한 지점의 채팅 속도 (초당 개수). 그 시점 직전 채팅 CHAT_PAGE_SIZE개의 시간 간격으로 계산
async function getPointSpeed(
  videoNo: number,
  playerMessageTime: number,
): Promise<number | null> {
  const url =
    `${CHZZK_API}/videos/${videoNo}/chats` +
    `?playerMessageTime=${playerMessageTime}&previousVideoChatSize=${CHAT_PAGE_SIZE}`;
  const res = await chzzkFetch(url);
  if (!res.ok) return null;

  const chats: { playerMessageTime?: number; messageTime?: number }[] =
    (await res.json()).content?.previousVideoChats ?? [];
  if (chats.length < 2) return 0;

  const times = chats
    .map((c) => c.playerMessageTime ?? c.messageTime ?? 0)
    .filter((t) => t > 0)
    .sort((a, b) => a - b);
  if (times.length < 2) return 0;

  const spanSec = (times[times.length - 1] - times[0]) / 1000;
  return spanSec > 0 ? times.length / spanSec : 0;
}

// 영상의 대표 분당 채팅 수 (영상을 9등분한 경계 8곳의 속도 중앙값)
async function getAvgChatPerMin(
  videoNo: number,
  durationSec: number,
): Promise<number> {
  const speeds: number[] = [];
  for (let i = 1; i <= SAMPLE_POINTS; i++) {
    const t = Math.floor((durationSec * 1000 * i) / (SAMPLE_POINTS + 1));
    const s = await getPointSpeed(videoNo, t);
    if (s !== null && s > 0) speeds.push(s);
    await sleep(DELAY_MS);
  }
  if (speeds.length === 0) return 0;

  speeds.sort((a, b) => a - b);
  const mid = Math.floor(speeds.length / 2);
  const medianPerSec =
    speeds.length % 2 === 0 ? (speeds[mid - 1] + speeds[mid]) / 2 : speeds[mid];

  return Math.round(medianPerSec * 60);
}

// 스트리머 1명: 아직 집계 안 한 최신 다시보기 1개를 집계·저장
// 반환: 집계했으면 true, 집계할 새 영상 없으면 false
export async function collectOneReplay(
  channelId: string,
  channelName: string,
): Promise<boolean> {
  const replays = await getRecentReplays(channelId, 10);
  if (replays.length === 0) return false;

  const existing = await prisma.videoChatStat.findMany({
    where: { videoId: { in: replays.map((r) => r.videoId) } },
    select: { videoId: true },
  });
  const done = new Set(existing.map((e) => e.videoId));

  const target = replays.find((r) => !done.has(r.videoId));
  if (!target) return false; // 다 집계됨

  const avgChatPerMin = await getAvgChatPerMin(
    target.videoNo,
    target.durationSec,
  );

  await prisma.videoChatStat.create({
    data: {
      videoId: target.videoId,
      videoNo: target.videoNo,
      channelId,
      channelName,
      videoTitle: target.videoTitle,
      thumbnailUrl: target.thumbnailUrl,
      publishDate: new Date(target.publishDate.replace(" ", "T") + "+09:00"),
      durationSec: target.durationSec,
      avgChatPerMin,
    },
  });
  return true;
}

/* ───────────── 상세 페이지 조회 ───────────── */

export type StreamerChatVideo = {
  videoId: string;
  videoNo: number | null;
  videoTitle: string;
  thumbnailUrl: string | null;
  publishDate: string; // ISO
  durationSec: number;
  chatPerMin: number;
};

export type StreamerChatStats = {
  videos: StreamerChatVideo[];
  recentAvg: number; // 최근 RECENT_AVG_COUNT개 다시보기 평균
  recentCount: number;
  rank: number | null; // 현재 시청자 TOP 50 안에서의 채팅 활발도 순위
  total: number; // 순위가 매겨진 인원 (데이터 있는 TOP 50 인원)
  poolSize: number;
};

const RECENT_AVG_COUNT = 10;
export const COLLECT_POOL_SIZE = 100;

// 현재 시청자 TOP 50 안에서 채팅 활발도 순위 (상세 페이지들이 공유하는 캐시)
async function getChatRankings(): Promise<
  { channelId: string; rank: number; total: number }[]
> {
  "use cache";
  cacheLife("statsTime");

  const top = await getTopStreamers(COLLECT_POOL_SIZE);
  const ids = top.map((s) => s.channelId);
  if (ids.length === 0) return [];

  return prisma.$queryRaw`
    WITH recent AS (
      SELECT "channelId", "avgChatPerMin",
             ROW_NUMBER() OVER (PARTITION BY "channelId" ORDER BY "publishDate" DESC) AS rn
      FROM "VideoChatStat"
      WHERE "avgChatPerMin" > 0
        AND "channelId" = ANY(${ids}::text[])
    ),
    per AS (
      SELECT "channelId", AVG("avgChatPerMin") AS avg
      FROM recent
      WHERE rn <= ${RECENT_AVG_COUNT}
      GROUP BY "channelId"
    )
    SELECT "channelId",
           RANK() OVER (ORDER BY avg DESC)::int AS "rank",
           COUNT(*) OVER ()::int AS "total"
    FROM per
  `;
}

// 상세 페이지용: 한 스트리머의 다시보기별 채팅 활발도
export async function getStreamerChatStats(
  channelId: string,
): Promise<StreamerChatStats> {
  "use cache";
  cacheLife("statsTime");

  const [rows, rankings] = await Promise.all([
    prisma.videoChatStat.findMany({
      where: { channelId, avgChatPerMin: { gt: 0 } },
      orderBy: { publishDate: "desc" },
      take: 30,
      select: {
        videoId: true,
        videoNo: true,
        videoTitle: true,
        thumbnailUrl: true,
        publishDate: true,
        durationSec: true,
        avgChatPerMin: true,
      },
    }),
    getChatRankings(),
  ]);

  const videos = rows.map((r) => ({
    videoId: r.videoId,
    videoNo: r.videoNo,
    videoTitle: r.videoTitle,
    thumbnailUrl: r.thumbnailUrl,
    publishDate: r.publishDate.toISOString(),
    durationSec: r.durationSec,
    chatPerMin: r.avgChatPerMin,
  }));

  const recent = videos.slice(0, RECENT_AVG_COUNT);
  const recentAvg = recent.length
    ? Math.round(recent.reduce((s, v) => s + v.chatPerMin, 0) / recent.length)
    : 0;

  const me = rankings.find((r) => r.channelId === channelId);

  return {
    videos,
    recentAvg,
    recentCount: recent.length,
    rank: me?.rank ?? null,
    total: rankings[0]?.total ?? 0,
    poolSize: COLLECT_POOL_SIZE,
  };
}

/* ───────────── 공통 ───────────── */

// 최근 7일 평균 시청자 상위 N명 (공식 채널 제외)
export async function getTopStreamers(
  limit = 50,
): Promise<{ channelId: string; channelName: string }[]> {
  const now = new Date();
  const to = new Date(now);
  const from = new Date(now);
  from.setDate(from.getDate() - 7);
  const range = toSummaryDateRange(from, to);

  const excludeIds = [...BROADCAST_CHANNEL_IDS];

  return prisma.$queryRaw<{ channelId: string; channelName: string }[]>`
    SELECT s."channelId", s."channelName"
    FROM "Streamer" s
    JOIN "StreamerDailySummary" d ON s."channelId" = d."channelId"
    WHERE d."date" >= ${range.from} AND d."date" < ${range.to}
      AND s."channelId" <> ALL(${excludeIds}::text[])
    GROUP BY s."channelId", s."channelName"
    ORDER BY COALESCE(ROUND(AVG(d."avgViewers")), 0) DESC
    LIMIT ${limit}
  `;
}
