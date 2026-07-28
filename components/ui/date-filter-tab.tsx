"use client";

import { CalendarDays } from "lucide-react";
import { subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/shared/DateRangePicker";

type Preset = { label: string; days: number };

const DEFAULT_PRESETS: Preset[] = [
  { label: "7일", days: 7 },
  { label: "14일", days: 14 },
  { label: "30일", days: 30 },
  { label: "90일", days: 90 },
];

type Props = {
  dateRange: DateRange;
  dayCount: number | null;
  onChange: (range: DateRange, days: number | null) => void;
  presets?: Preset[];
};

export function DateFilterTab({
  dateRange,
  dayCount,
  onChange,
  presets = DEFAULT_PRESETS,
}: Props) {
  function applyPreset(days: number) {
    onChange({ from: subDays(new Date(), days), to: new Date() }, days);
  }

  function handlePicker(range: DateRange | undefined) {
    if (!range?.from || !range?.to) return;
    onChange(range, null);
  }

  return (
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
                dayCount === p.days ? "" : "text-white/40 hover:text-white/70"
              }
            >
              {p.label}
            </span>
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-white/10" />

      <DateRangePicker value={dateRange} onChange={handlePicker} />
    </div>
  );
}
