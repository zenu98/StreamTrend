import { toKSTDateFullString } from "./utils";

// lib/anime.ts
export type OfficialAnime = {
  id: string;
  title: string;
  aliases: string[];
  startDate: string; // 공식 상영 시작일
  endDate: string; // 공식 상영 종료일
  thumbnail?: string;
};
export const ANIME_EXTRA_CHANNEL_IDS = [
  "75cbf189b3bb8f9f687d2aca0d0a382b", // 한동숙 talk로 하고 애니쳐봄
];
export const OFFICIAL_ANIME: OfficialAnime[] = [
  {
    id: "bluelock",
    title: "블루 록",
    aliases: ["블루록", "블루 록", "bluelock", "blue lock"],
    startDate: "2026-07-03",
    endDate: "2026-08-01",
    thumbnail: "/anime/bluelock.webp",
  },
  {
    id: "kindaichi",
    title: "소년탐정 김전일",
    aliases: ["김전일", "소년탐정", "소년탐전"],
    startDate: "2026-07-31",
    endDate: "2026-08-29",
    thumbnail: "/anime/kim.webp",
  },
  {
    id: "olympos-guardian",
    title: "올림포스 가디언",
    aliases: [
      "올림포스",
      "올림푸스",
      "올림뿌스",
      "올림뿝스",
      "올림푸수",
      "졸림푸스",
      "노잼푸스",
      "올포",
    ],
    startDate: "2026-08-28",
    endDate: "2026-09-26",
    thumbnail: "/anime/olympus.webp",
  },
  {
    id: "evangelion",
    title: "신세기 에반게리온",
    aliases: [
      "에반게리온",
      "에게리",
      "에게뤼",
      "에바",
      "에반데",
      "신세기",
      "eoe",
      "EOE",
    ],
    startDate: "2026-09-24",
    endDate: "2026-10-23",
    thumbnail: "/anime/evangelion.webp",
  },
];

function normalize(title: string): string {
  return title.toLowerCase().replace(/\s+/g, "");
}

export function matchAnime(title: string, date: Date): OfficialAnime | null {
  const normalized = normalize(title);
  const dateStr = toKSTDateFullString(date);

  const matches = OFFICIAL_ANIME.filter(
    (a) =>
      dateStr >= a.startDate &&
      dateStr <= a.endDate &&
      a.aliases.some((alias) => normalized.includes(normalize(alias))),
  );

  return matches.length === 1 ? matches[0] : null;
}
