"use client";

type MonthGroup = { label: string; weeks: { label: string }[] };

export function MonthWeekFilterTab({
  groups,
  monthIndex,
  weekIndex,
  onChange,
}: {
  groups: MonthGroup[];
  monthIndex: number;
  weekIndex: number;
  onChange: (monthIndex: number, weekIndex: number) => void;
}) {
  const currentGroup = groups[monthIndex];

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-1.5">
      <div className="flex items-center gap-0.5">
        {groups.map((g, i) => (
          <button
            key={i}
            onClick={() => onChange(i, groups[i].weeks.length - 1)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              i === monthIndex
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-white/10" />

      <div className="flex items-center gap-0.5">
        {currentGroup.weeks.map((w, i) => (
          <button
            key={i}
            onClick={() => onChange(monthIndex, i)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              i === weekIndex
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>
    </div>
  );
}
