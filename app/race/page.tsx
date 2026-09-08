"use client";

import { useState } from "react";
import { UnderlineTabs } from "@/components/shared/UnderlineTabs";
import { RankingRaceChart } from "@/components/race/RankingRaceChart";
import type { Entity } from "@/lib/rankingRace";

const tabs = [
  { label: "게임", key: "game" as const },
  { label: "스트리머", key: "streamer" as const },
];

export default function RacePage() {
  const [active, setActive] = useState<Entity>("game");

  return (
    <main className="p-4 mx-auto w-full space-y-8">
      <div>
        <h1 className="text-xl font-bold md:text-2xl">랭킹 레이스</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          기간에 따라 순위가 어떻게 바뀌었는지 움직이는 그래프로 확인해보세요.
        </p>
      </div>

      <UnderlineTabs options={tabs} active={active} onChange={setActive} />

      <RankingRaceChart key={active} entity={active} />
    </main>
  );
}
