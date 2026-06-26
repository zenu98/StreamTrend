"use client";

import Image from "next/image";
import Link from "next/link";
import { StatsCategoryData } from "@/types/chart";

type Props = {
  title: string;
  description: string;
  data: (StatsCategoryData & { posterImageUrl?: string | null })[];
  valueKey: "maxViewers" | "peakViewers";
  valueLabel: string;
};

export function RankingCards({
  title,
  description,
  data,
  valueKey,
  valueLabel,
}: Props) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5  gap-2 max-w-sm md:max-w-none mx-auto">
        {data.slice(0, 10).map((item, i) => (
          <Link
            key={item.category}
            href={`/games/${encodeURIComponent(item.categoryId)}`}
            className="relative rounded-lg overflow-hidden aspect-3/4  group"
          >
            {/* 배경 썸네일 */}
            {item.posterImageUrl ? (
              <Image
                src={item.posterImageUrl}
                alt={item.category}
                fill
                sizes="(max-width: 768px) 20vw, 10vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 bg-muted" />
            )}

            {/* 텍스트 영역 그라데이션 */}
            <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-linear-to-t from-black/80 to-transparent" />

            {/* 순위 */}
            <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{i + 1}</span>
            </div>

            {/* 텍스트 */}
            <div className="absolute bottom-0 left-0 right-0 p-2 space-y-0.5">
              <p className="text-white text-lg font-bold line-clamp-1">
                {item.category}
              </p>
              <p className="text-white/80 text-md">
                {item[valueKey].toLocaleString()}
                {valueLabel}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
