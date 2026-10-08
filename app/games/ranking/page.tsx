// app/games/ranking/page.tsx
import { getMonthWeekOptions } from "@/lib/utils";
import { getGameRanking } from "@/lib/gameStats";
import { GameRankingPageClient } from "@/components/game/GameRankingPageClient";
import { connection } from "next/server";
import { Info } from "lucide-react";

export const SCORE_TOOLTIP_LINES = [
  "인기점수 = 시청자 (60%) + 방송 수 (40%) — 각각 상위 20개 게임의 평균(최근 7일)의 30%를 기준선으로 삼아, 기준선과 같으면 50점, 많으면 50점 이상, 적으면 50점 이하로 환산해 합산해요",
  "1등이 아닌 상위권 평균을 기준으로 삼아, 소수 상위권에만 점수가 쏠리지 않도록 했어요",
  "공식 채널·중계 방송은 제외하고, 스트리머가 직접 플레이하는 방송만 집계해요",
];

function InfoTooltip({ lines }: { lines: string[] }) {
  return (
    <div className="relative group">
      <Info className="h-4 w-4 cursor-help text-white/30" />
      <div className="absolute left-0 top-full z-10 mt-2 hidden w-72 space-y-1.5 rounded-lg bg-white/10 p-3 text-left text-xs text-white/70 backdrop-blur-sm group-hover:block md:w-80">
        {lines.map((line, i) => (
          <p key={i}>· {line}</p>
        ))}
      </div>
    </div>
  );
}

export default async function GameRankingPage() {
  await connection();

  const groups = getMonthWeekOptions();
  const initialMonthIndex = groups.length - 1;
  const initialWeekIndex = groups[initialMonthIndex].weeks.length - 1;
  const initialWeek = groups[initialMonthIndex].weeks[initialWeekIndex];

  const initialGames = await getGameRanking(initialWeek.from, initialWeek.to);

  return (
    <main className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">게임 순위</h1>
        <InfoTooltip lines={SCORE_TOOLTIP_LINES} />
      </div>
      <GameRankingPageClient
        groups={groups.map((g) => ({
          label: g.label,
          weeks: g.weeks.map((w) => ({ label: w.label })),
        }))}
        initialMonthIndex={initialMonthIndex}
        initialWeekIndex={initialWeekIndex}
        initialGames={initialGames}
      />
    </main>
  );
}
