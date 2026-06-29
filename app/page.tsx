import { LiveSection } from "@/components/shared/LiveSection";
import { GameCompareChart } from "@/components/shared/GameCompareChart";
import { StatsSection } from "@/components/shared/StatsSection";
import { getStats, getStatsByDate } from "@/lib/stats";
import { getLives } from "@/lib/lives";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="p-4 md:p-8 space-y-12">
      <Suspense
        fallback={<div className="text-muted-foreground">로딩 중...</div>}
      >
        <LiveSection />
      </Suspense>
      <Suspense
        fallback={<div className="text-muted-foreground">로딩 중...</div>}
      >
        <HomeContent />
      </Suspense>
    </main>
  );
}

async function HomeContent() {
  const [daily, weekly, monthly, weeklyByDate, monthlyByDate, lives] =
    await Promise.all([
      getStats("daily"),
      getStats("weekly"),
      getStats("monthly"),
      getStatsByDate("weekly"),
      getStatsByDate("monthly"),
      getLives(),
    ]);
  const top3Games = lives.byViewers.slice(0, 3).map((d) => d.category);

  return (
    <>
      <GameCompareChart
        defaultGames={top3Games}
        weekly={weeklyByDate}
        monthly={monthlyByDate}
      />
      <StatsSection daily={daily} weekly={weekly} monthly={monthly} />
    </>
  );
}
