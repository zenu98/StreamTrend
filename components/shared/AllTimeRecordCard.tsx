import { Trophy, Users } from "lucide-react";

type Props = {
  maxViewers: number;
  maxViewersDate: string | null;
};

export function AllTimeRecordCard({ maxViewers, maxViewersDate }: Props) {
  return (
    <div className="flex w-full min-w-0 max-w-full items-center gap-4 rounded-2xl border border-amber-400/20 bg-card px-5 py-4 sm:min-w-[33%] sm:w-fit">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-400/10">
        <Trophy className="h-5 w-5 text-amber-300" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          역대 최고 동시시청자
        </p>
        <p className="text-4xl font-semibold text-amber-300">
          {maxViewers.toLocaleString()}
          <span className="ml-0.5 text-sm font-normal text-muted-foreground">
            명
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          {maxViewersDate && `  ${maxViewersDate}`}
        </p>
      </div>
    </div>
  );
}
