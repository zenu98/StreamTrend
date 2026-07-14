type Props = {
  size?: number;
  thickness?: number;
  label?: string;
};

export function LoadingSpinner({ size = 40, thickness = 4, label }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className="animate-spin rounded-full"
        style={{
          width: size,
          height: size,
          background:
            "conic-gradient(from 0deg, transparent, var(--chart-1), var(--chart-2), transparent)",
          WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px))`,
          mask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px))`,
        }}
      />
      {label && <p className="text-xs text-white/40">{label}</p>}
    </div>
  );
}
