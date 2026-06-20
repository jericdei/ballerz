"use client";

import { Check, Clock } from "lucide-react";

import {
  getAutoAdvancePeriod,
  getGamePeriodIndex,
  getVisibleGamePeriods,
} from "@repo/shared";

import { formatPeriodLabel } from "@/components/statsheet/statsheet-labels";
import { StatsheetClockPanel } from "@/components/statsheet/statsheet-clock-panel";
import { getTeamTheme, withAlpha } from "@/lib/team-colors";
import { cn } from "@/lib/utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";

export function StatsheetScoreboard({
  hideCompactClock = false,
}: {
  hideCompactClock?: boolean;
}) {
  const game = useStatsheetStore((state) => state.game);
  const currentPeriod = useStatsheetStore((state) => state.currentPeriod);
  const firstTeamScore = useStatsheetStore((state) => state.firstTeamScore);
  const secondTeamScore = useStatsheetStore((state) => state.secondTeamScore);

  const currentIndex = getGamePeriodIndex(currentPeriod);
  const nextPeriod = getAutoAdvancePeriod(
    currentPeriod,
    firstTeamScore,
    secondTeamScore,
  );
  const visiblePeriods = getVisibleGamePeriods(currentPeriod, nextPeriod);

  if (!game?.firstTeamId || !game.secondTeamId) {
    return null;
  }

  const firstTheme = getTeamTheme(game.firstTeamColor);
  const secondTheme = getTeamTheme(game.secondTeamColor);

  return (
    <section
      className="shrink-0 border-b px-3 py-3 sm:px-4 sm:py-4 md:px-6"
      style={{
        background: `linear-gradient(to right, ${withAlpha(firstTheme.color, 0.06)} 0%, transparent 50%, ${withAlpha(secondTheme.color, 0.06)} 100%)`,
      }}
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 sm:gap-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3 md:gap-4">
          <div className="min-w-0 text-right">
            <p
              className="text-[10px] font-medium uppercase tracking-wider sm:text-xs"
              style={{ color: firstTheme.color }}
            >
              Away
            </p>
            <p className="truncate text-sm font-semibold sm:text-lg md:text-xl">
              {game.firstTeamName ?? "Team 1"}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-5">
            <span
              className="min-w-[2ch] text-center text-3xl font-bold tabular-nums sm:min-w-[3ch] sm:text-4xl md:text-5xl"
              style={{ color: firstTheme.color }}
            >
              {firstTeamScore}
            </span>
            <span className="text-xl font-light text-muted-foreground sm:text-2xl">
              –
            </span>
            <span
              className="min-w-[2ch] text-center text-3xl font-bold tabular-nums sm:min-w-[3ch] sm:text-4xl md:text-5xl"
              style={{ color: secondTheme.color }}
            >
              {secondTeamScore}
            </span>
          </div>

          <div className="min-w-0">
            <p
              className="text-[10px] font-medium uppercase tracking-wider sm:text-xs"
              style={{ color: secondTheme.color }}
            >
              Home
            </p>
            <p className="truncate text-sm font-semibold sm:text-lg md:text-xl">
              {game.secondTeamName ?? "Team 2"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 sm:gap-3">
          <div className="flex w-full max-w-full flex-wrap items-center justify-center gap-2">
            <div
              aria-label={`Current period: ${formatPeriodLabel(currentPeriod)}`}
              className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm sm:px-4 sm:py-1.5 sm:text-sm"
            >
              {formatPeriodLabel(currentPeriod)}
            </div>

            {hideCompactClock ? null : (
              <div className="hidden shrink-0 md:block">
                <StatsheetClockPanel compact />
              </div>
            )}

            <div className="max-w-full overflow-x-auto">
              <div className="flex w-max items-center gap-1 rounded-full border bg-card p-1 shadow-sm">
                <Clock className="mx-1 size-3.5 shrink-0 text-muted-foreground sm:mx-2 sm:size-4" />
                {visiblePeriods.map((period) => {
                  const index = getGamePeriodIndex(period);
                  const isPast = index < currentIndex;
                  const isCurrent = period === currentPeriod;
                  const isFuture = index > currentIndex;

                  return (
                    <div
                      aria-current={isCurrent ? "step" : undefined}
                      className={cn(
                        "flex shrink-0 items-center gap-1 rounded-full px-1.5 py-1 text-[10px] font-semibold sm:px-2 sm:py-1.5 sm:text-xs",
                        isCurrent &&
                          "bg-primary text-primary-foreground shadow-sm",
                        isPast && "text-muted-foreground",
                        isFuture && "text-muted-foreground/40",
                      )}
                      key={period}
                    >
                      {isPast ? <Check aria-hidden className="size-3" /> : null}
                      {formatPeriodLabel(period)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
