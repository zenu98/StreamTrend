import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";
import {
  OFFICIAL_ANIME,
  ANIME_EXTRA_CHANNEL_IDS,
  matchAnime,
} from "@/lib/anime";
import { getKSTDateString, toKSTDateFullString } from "@/lib/utils";

export const ANIMATION_CATEGORY_ID = "animation";
const TOP_N = 5;

export type AnimeTopStreamer = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  maxViewers: number;
  date: string;
  liveTitle: string;
};

export type AnimeSummary = {
  id: string;
  title: string;
  thumbnail: string | null;
  startDate: string;
  endDate: string;
  status: "upcoming" | "airing" | "ended";
  maxViewers: number;
  topStreamers: AnimeTopStreamer[];
  streamerCount: number;
};

const STATUS_ORDER = { airing: 0, upcoming: 1, ended: 2 } as const;

export async function getAnimeSummaries(): Promise<AnimeSummary[]> {
  "use cache";
  cacheLife("statsTime");

  const todayStr = getKSTDateString();

  const earliestStart = OFFICIAL_ANIME.map((a) => a.startDate).sort()[0];
  const from = new Date(`${earliestStart}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - 1);

  const rows = await prisma.streamerDailySummary.findMany({
    where: {
      date: { gte: from },
      OR: [
        { liveCategory: ANIMATION_CATEGORY_ID },
        { channelId: { in: ANIME_EXTRA_CHANNEL_IDS } },
      ],
    },
    select: {
      date: true,
      channelId: true,
      channelName: true,
      channelImageUrl: true,
      liveTitle: true,
      maxViewers: true,
    },
  });

  // 작품별로 "채널당 최고 기록 하나"만 남김
  const byAnime = new Map<string, Map<string, AnimeTopStreamer>>();

  for (const row of rows) {
    const anime = matchAnime(row.liveTitle, row.date);
    if (!anime) continue;

    const channels =
      byAnime.get(anime.id) ?? new Map<string, AnimeTopStreamer>();
    const prev = channels.get(row.channelId);

    if (!prev || row.maxViewers > prev.maxViewers) {
      channels.set(row.channelId, {
        channelId: row.channelId,
        channelName: row.channelName,
        channelImageUrl: row.channelImageUrl,
        maxViewers: row.maxViewers,
        date: toKSTDateFullString(row.date),
        liveTitle: row.liveTitle,
      });
    }
    byAnime.set(anime.id, channels);
  }

  const summaries = OFFICIAL_ANIME.map((a): AnimeSummary => {
    const channels = byAnime.get(a.id);
    const ranked = channels
      ? [...channels.values()].sort((x, y) => y.maxViewers - x.maxViewers)
      : [];

    const status =
      todayStr < a.startDate
        ? "upcoming"
        : todayStr > a.endDate
          ? "ended"
          : "airing";

    return {
      id: a.id,
      title: a.title,
      thumbnail: a.thumbnail ?? null,
      startDate: a.startDate,
      endDate: a.endDate,
      status,
      maxViewers: ranked[0]?.maxViewers ?? 0,
      topStreamers: ranked.slice(0, TOP_N),
      streamerCount: ranked.length,
    };
  });

  return summaries.sort((a, b) => {
    if (a.status !== b.status)
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    return b.endDate.localeCompare(a.endDate);
  });
}
