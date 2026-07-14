import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://stream-trend-roan.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, streamers] = await Promise.all([
    prisma.category.findMany({
      select: { categoryId: true, updatedAt: true },
    }),
    prisma.streamer.findMany({
      select: { channelId: true, updatedAt: true },
    }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "always", priority: 1 },
    { url: `${BASE_URL}/games`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/streamers`, changeFrequency: "hourly", priority: 0.9 },
  ];

  const gamePages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/games/${encodeURIComponent(c.categoryId)}`,
    lastModified: c.updatedAt,
    changeFrequency: "hourly",
    priority: 0.7,
  }));

  const streamerPages: MetadataRoute.Sitemap = streamers.map((s) => ({
    url: `${BASE_URL}/streamers/${s.channelId}`,
    lastModified: s.updatedAt,
    changeFrequency: "hourly",
    priority: 0.6,
  }));

  return [...staticPages, ...gamePages, ...streamerPages];
}
