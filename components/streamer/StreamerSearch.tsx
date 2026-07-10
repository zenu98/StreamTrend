"use client";

import { SearchInput } from "@/components/shared/SearchInput";
import Image from "next/image";
import Link from "next/link";

type Streamer = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
};

export function StreamerSearch() {
  return (
    <SearchInput<Streamer>
      placeholder="스트리머 이름 검색..."
      fetchUrl={(q) => `/api/search/streamer?q=${encodeURIComponent(q)}`}
      getKey={(item) => item.channelId}
      renderResult={(item) => (
        <Link
          href={`/streamers/${item.channelId}`}
          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:border-primary transition-colors"
        >
          {item.channelImageUrl ? (
            <Image
              src={item.channelImageUrl}
              alt={item.channelName}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm">
              {item.channelName[0]}
            </div>
          )}
          <span className="font-medium">{item.channelName}</span>
        </Link>
      )}
    />
  );
}
