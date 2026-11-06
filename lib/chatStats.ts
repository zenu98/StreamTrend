import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";
import { toSummaryDateRange } from "@/lib/utils";
import { BROADCAST_CHANNEL_IDS } from "@/lib/data/channel";
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
const SAMPLE_POINTS = 8;
const CHAT_PAGE_SIZE = 50;
const DELAY_MS = 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Replay = {
  videoId: string;
  videoNo: number;
  videoTitle: string;
  thumbnailUrl: string | null;
  publishDate: string;
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

  // 임시: videoId 없는 영상 확인용
  for (const v of list) {
    if (!v.videoId) {
      console.log("[null videoId]", {
        videoNo: v.videoNo,
        title: v.videoTitle,
        videoType: v.videoType,
        adult: v.adult,
        publishDate: v.publishDate,
        keys: Object.keys(v),
      });
    }
  }

  return list
    .filter(
      (v: any) =>
        v.videoId &&
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

// 한 지점의 채팅 속도 (초당 개수)
async function getPointSpeed(
  videoNo: number,
  playerMessageTime: number,
): Promise<number | null> {
  const url =
    `${CHZZK_API}/videos/${videoNo}/chats` +
    `?playerMessageTime=${playerMessageTime}&previousVideoChatSize=${CHAT_PAGE_SIZE}`;
  //   const res = await fetch(url, { cache: "no-store", headers: CHZZK_HEADERS });
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

// 영상 평균 분당 채팅 수
// 영상의 대표 분당 채팅 수 (8개 지점 속도의 중앙값)
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

// 상세 페이지용: 한 스트리머의 채팅 지표 조회
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
  recentAvg: number; // 최근 RECENT_AVG_COUNT개 영상의 평균
  recentCount: number;
};

const RECENT_AVG_COUNT = 10;

// 상세 페이지용: 한 스트리머의 다시보기별 분당 채팅
export async function getStreamerChatStats(
  channelId: string,
): Promise<StreamerChatStats> {
  "use cache";
  cacheLife("statsTime");

  const rows = await prisma.videoChatStat.findMany({
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
  });

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

  return { videos, recentAvg, recentCount: recent.length };
}

// 최근 7일 평균 시청자 상위 N명의 channelId, channelName
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
