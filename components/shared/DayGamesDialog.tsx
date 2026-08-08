"use client";

import Image from "next/image";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDuration } from "@/lib/utils";

type GameRow = {
  liveCategory: string;
  liveCategoryValue: string;
  avgViewers: number;
  posterImageUrl: string | null;
  broadcastCount: number;
};

type Props = {
  date: string | null;
  games: GameRow[];
  onClose: () => void;
};

export function DayGamesDialog({ date, games, onClose }: Props) {
  return (
    <Dialog open={!!date} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {date && format(parseISO(date), "M월 d일", { locale: ko })} 방송한
            게임
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-96 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {games.map((g) => (
            <div
              key={g.liveCategory}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5"
            >
              <div className="w-10 aspect-[3/4] rounded overflow-hidden bg-white/10 flex-shrink-0">
                {g.posterImageUrl ? (
                  <Image
                    src={g.posterImageUrl}
                    alt={g.liveCategoryValue}
                    width={40}
                    height={53}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-white/60">
                    {g.liveCategoryValue[0]}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {g.liveCategoryValue}
                </p>
                <p className="text-xs text-white/40">
                  평균 {g.avgViewers.toLocaleString()}명 ·{" "}
                  {formatDuration(g.broadcastCount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
