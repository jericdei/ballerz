"use client";

import { Clock } from "lucide-react";

import { GAME_PERIODS } from "@repo/shared";

import { formatPeriodLabel } from "@/components/statsheet/statsheet-labels";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";

const statusStyles: Record<string, string> = {
  scheduled: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  in_progress: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  halftime: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  final: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
};

export function StatsheetScoreboard() {
  const game = useStatsheetStore((state) => state.game);
  const currentPeriod = useStatsheetStore((state) => state.currentPeriod);
  const setPeriod = useStatsheetStore((state) => state.setPeriod);
  const firstTeamScore = useStatsheetStore((state) => state.firstTeamScore);
  const secondTeamScore = useStatsheetStore((state) => state.secondTeamScore);
  const dirty = useStatsheetStore((state) => state.dirty);

  if (!game?.firstTeamId || !game.secondTeamId) {
    return null;
  }

  const statusLabel = game.status.replaceAll("_", " ");

  return (
    <section className="shrink-0 border-b bg-gradient-to-r from-blue-500/5 via-background to-orange-500/5 px-4 py-4 md:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Away
            </p>
            <p className="truncate text-lg font-semibold md:text-xl">
              {game.firstTeamName ?? "Team 1"}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 md:gap-5">
            <span className="min-w-[3ch] text-center text-4xl font-bold tabular-nums text-blue-600 md:text-5xl dark:text-blue-400">
              {firstTeamScore}
            </span>
            <span className="text-2xl font-light text-muted-foreground">–</span>
            <span className="min-w-[3ch] text-center text-4xl font-bold tabular-nums text-orange-600 md:text-5xl dark:text-orange-400">
              {secondTeamScore}
            </span>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Home
            </p>
            <p className="truncate text-lg font-semibold md:text-xl">
              {game.secondTeamName ?? "Team 2"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex items-center gap-1 rounded-full border bg-card p-1 shadow-sm">
            <Clock className="mx-2 size-4 text-muted-foreground" />
            {GAME_PERIODS.map((period) => (
              <button
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  currentPeriod === period
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                key={period}
                onClick={() => setPeriod(period)}
                type="button"
              >
                {formatPeriodLabel(period)}
              </button>
            ))}
          </div>

          <Badge
            className={cn(
              "capitalize",
              statusStyles[game.status] ?? "bg-muted text-muted-foreground",
            )}
            variant="secondary"
          >
            {statusLabel}
          </Badge>

          {dirty ? (
            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">
              Unsaved changes
            </Badge>
          ) : null}
        </div>
      </div>
    </section>
  );
}
