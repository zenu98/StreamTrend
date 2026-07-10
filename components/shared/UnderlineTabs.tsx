"use client";

export function UnderlineTabs<T extends string>({
  options,
  active,
  onChange,
}: {
  options: readonly { label: string; key: T }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="flex w-fit items-center border-b border-white/10">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`relative whitespace-nowrap px-3 pb-2.5 text-sm font-medium transition-colors ${
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
