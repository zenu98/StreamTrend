"use client";

import { useState } from "react";
import { DateRange } from "react-day-picker";
import { differenceInCalendarDays } from "date-fns";
import { CalendarDays } from "lucide-react";
import { GameTrendChart } from "@/components/shared/GameTrendChart";
import { GameCompareChart } from "@/components/shared/GameCompareChart";
import { DateRangePicker } from "@/components/shared/DateRangePicker";

type Row = {
  date: string;
  totalViewers: number;
  concurrentViewers: number;
  broadcastCount: number;
  maxViewers: number;
  peakViewers: number;
};

type Category = {
  categoryId: string;
  categoryValue: string;
};

type Metric = "concurrentViewers" | "maxViewers" | "peakViewers";

type Props = {
  allRows: Row[];
  defaultGame: string;
  defaultCategoryId: string;
  allCategories: Category[];
};

const tabs = [
  { label: "추이", key: "single" },
  { label: "비교", key: "compare" },
] as const;

const metricTabs = [
  { label: "평균 시청자", key: "concurrentViewers" as const },
  { label: "최고 동시시청자", key: "maxViewers" as const },
  { label: "최고 시청자", key: "peakViewers" as const },
];

const presets = [
  { label: "7일", days: 7 },
  { label: "14일", days: 14 },
  { label: "30일", days: 30 },
];

function SegmentedControl<T extends string>({
  options,
  active,
  onChange,
}: {
  options: readonly { label: string; key: T }[];
  active: T;
  onChange: (key: T) => void;
}) {
  const activeIndex = options.findIndex((o) => o.key === active);

  return (
    <div className="relative inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
      <div
        className="absolute inset-y-1 left-1 rounded-full transition-transform duration-300 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
          background: "var(--chart-1)",
        }}
      />
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          style={
            opt.key === active ? { color: "var(--background)" } : undefined
          }
          className="relative z-10 flex-1 whitespace-nowrap rounded-full px-5 py-1.5 text-sm font-medium text-white/45 transition-colors hover:text-white/75 data-[active=true]:text-inherit"
          data-active={opt.key === active}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function UnderlineTabs<T extends string>({
  options,
  active,
  onChange,
}: {
  options: readonly { label: string; key: T }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="flex items-center gap-6 border-b border-white/10 pl-1">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`relative whitespace-nowrap pb-2.5 text-sm font-medium transition-colors ${
            opt.key === active
              ? "text-white"
              : "text-white/35 hover:text-white/60"
          }`}
        >
          {opt.label}
          {opt.key === active && (
            <span
              className="absolute inset-x-0 -bottom-px h-0.5 rounded-full"
              style={{ background: "var(--chart-1)" }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

export function GameChartTabs({
  allRows,
  defaultGame,
  defaultCategoryId,
  allCategories,
}: Props) {
  const [active, setActive] = useState<"single" | "compare">("single");
  const [metric, setMetric] = useState<Metric>("concurrentViewers");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = new Date();
    from.setDate(from.getDate() - 7);
    return { from, to: new Date() };
  });
  const [selected, setSelected] = useState<string[]>(() =>
    defaultGame ? [defaultGame] : [],
  );

  const dayCount =
    dateRange?.from && dateRange?.to
      ? differenceInCalendarDays(dateRange.to, dateRange.from) + 1
      : null;

  const applyPreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    setDateRange({ from, to });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <SegmentedControl options={tabs} active={active} onChange={setActive} />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <UnderlineTabs
            options={metricTabs}
            active={metric}
            onChange={setMetric}
          />

          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-sm font-semibold text-white">
              <CalendarDays className="h-4 w-4 shrink-0 text-white/40" />
              {dayCount ? `최근 ${dayCount}일` : "기간 선택"}
            </div>

            <div className="h-5 w-px bg-white/10" />

            <div className="flex items-center gap-0.5">
              {presets.map((p) => (
                <button
                  key={p.days}
                  onClick={() => applyPreset(p.days)}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                  style={
                    dayCount === p.days
                      ? {
                          background:
                            "color-mix(in oklch, var(--chart-1), transparent 85%)",
                          color: "var(--chart-1)",
                        }
                      : undefined
                  }
                >
                  <span
                    className={
                      dayCount === p.days
                        ? ""
                        : "text-white/40 hover:text-white/70"
                    }
                  >
                    {p.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-white/10" />

            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>
      {active === "single" ? (
        <GameTrendChart
          allRows={allRows}
          dateRange={dateRange}
          metric={metric}
        />
      ) : (
        <GameCompareChart
          defaultGame={defaultGame}
          defaultCategoryId={defaultCategoryId}
          defaultRows={allRows}
          allCategories={allCategories}
          selected={selected}
          onSelectedChange={setSelected}
          dateRange={dateRange}
          metric={metric}
        />
      )}
    </div>
  );
}
