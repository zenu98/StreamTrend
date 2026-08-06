import { Info } from "lucide-react";
import { ReactNode } from "react";

export function Notice({
  title = "수치 안내",
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`max-w-4xl border border-white/10 rounded-lg p-4 bg-white/5 text-sm space-y-2 ${className}`}
    >
      <div className="font-semibold flex items-center text-white/50 gap-1">
        <Info className="w-4 h-4" />
        <div>{title}</div>
      </div>
      <p className="text-white/40 leading-relaxed">{children}</p>
    </div>
  );
}
