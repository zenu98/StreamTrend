import { LiveSection } from "@/components/shared/LiveSection";
import { GameCompareChart } from "@/components/shared/GameCompareChart";
import { StatsSection } from "@/components/shared/StatsSection";
import { getStats, getStatsByDate } from "@/lib/stats";
import { getLives } from "@/lib/lives";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="p-4 md:p-8 space-y-12">
      {/* <Suspense
        fallback={<div className="text-muted-foreground">로딩 중...</div>}
      >
        <LiveSection />
      </Suspense> */}
      <Suspense
        fallback={<div className="text-muted-foreground">로딩 중...</div>}
      >
        <HomeContent />
      </Suspense>
    </main>
  );
}

async function HomeContent() {
  console.time("total");

  console.time("getStats daily");
  const daily = await getStats("daily");
  console.timeEnd("getStats daily");

  console.time("getStats weekly");
  const weekly = await getStats("weekly");
  console.timeEnd("getStats weekly");

  console.time("getStats monthly");
  const monthly = await getStats("monthly");
  console.timeEnd("getStats monthly");

  console.time("getStatsByDate weekly");
  const weeklyByDate = await getStatsByDate("weekly");
  console.timeEnd("getStatsByDate weekly");

  console.time("getStatsByDate monthly");
  const monthlyByDate = await getStatsByDate("monthly");
  console.timeEnd("getStatsByDate monthly");

  console.time("getLives");
  const lives = await getLives();
  console.timeEnd("getLives");

  console.timeEnd("total");

  const top3Games = lives.byViewers.slice(0, 3).map((d) => d.category);

  return (
    <>
      <StatsSection
        daily={daily}
        weekly={weekly}
        monthly={monthly}
        lives={lives}
      />
      <GameCompareChart
        defaultGames={top3Games}
        weekly={weeklyByDate}
        monthly={monthlyByDate}
      />
    </>
  );
}
