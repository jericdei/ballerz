"use client";

import { getRemainingTimeouts } from "@repo/shared";

import { getTeamTheme } from "@/lib/team-colors";
import { cn } from "@/lib/utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";

type IndicatorSize = "sm" | "lg";

type FoulBarsProps = {
  fouls: number;
  barCount?: number;
  className?: string;
  litClassName?: string;
  size?: IndicatorSize;
  unlitClassName?: string;
};

export function FoulBars({
  fouls,
  barCount = 5,
  className,
  litClassName = "bg-amber-500",
  size = "sm",
  unlitClassName = "bg-muted-foreground/20",
}: FoulBarsProps) {
  const litFouls = Math.min(fouls, barCount);
  const isLarge = size === "lg";

  return (
    <div
      aria-label={`${fouls} team fouls this quarter`}
      className={cn(
        "flex items-center",
        isLarge ? "gap-1 md:gap-1.5" : "gap-0.5",
        className,
      )}
    >
      {Array.from({ length: barCount }, (_, index) => {
        const isLit = index < litFouls;

        return (
          <div
            className={cn(
              "rounded-sm",
              isLarge ? "h-10 w-2 md:h-12 md:w-2.5" : "h-3.5 w-1",
              isLit ? litClassName : unlitClassName,
            )}
            key={index}
          />
        );
      })}
    </div>
  );
}

type RemainingTimeoutsCardProps = {
  remaining: number;
  className?: string;
  size?: IndicatorSize;
  teamColor?: string;
};

export function RemainingTimeoutsCard({
  remaining,
  className,
  size = "sm",
  teamColor,
}: RemainingTimeoutsCardProps) {
  const isLarge = size === "lg";
  const theme = teamColor ? getTeamTheme(teamColor) : null;
  const hasTimeouts = remaining > 0;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border text-center",
        isLarge
          ? "min-w-18 px-3 py-2 md:min-w-20 md:px-4 md:py-2.5"
          : "px-2 py-1",
        hasTimeouts
          ? theme
            ? null
            : "border-amber-500/35 bg-amber-500/12 text-amber-800 dark:text-amber-200"
          : "border-border bg-muted/50 text-muted-foreground",
        className,
      )}
      style={
        hasTimeouts && theme
          ? {
              borderColor: theme.borderColor,
              backgroundColor: theme.badgeBackground,
              color: theme.color,
            }
          : undefined
      }
      title="Timeouts remaining this quarter"
    >
      <span
        className={cn(
          "font-mono font-bold tabular-nums leading-none",
          isLarge ? "text-2xl md:text-3xl" : "text-sm",
        )}
      >
        {remaining}
      </span>
      <span
        className={cn(
          "font-semibold uppercase tracking-wide opacity-80",
          isLarge ? "mt-1 text-[10px] md:text-xs" : "text-[9px]",
        )}
      >
        TO
      </span>
    </div>
  );
}

type TeamPeriodIndicatorsProps = {
  teamId: number;
  align?: "start" | "end";
  className?: string;
  size?: IndicatorSize;
  teamColor?: string;
};

export function TeamPeriodIndicators({
  teamId,
  align = "start",
  className,
  size = "sm",
  teamColor,
}: TeamPeriodIndicatorsProps) {
  const game = useStatsheetStore((state) => state.game);
  const teamPeriodStats = useStatsheetStore((state) => state.teamPeriodStats);
  const currentPeriod = useStatsheetStore((state) => state.currentPeriod);

  const periodKey = `${teamId}:${currentPeriod}`;
  const periodStats = teamPeriodStats[periodKey] ?? {
    timeoutsUsed: 0,
    teamFouls: 0,
  };
  const timeoutsPerQuarter = game?.timeoutsPerQuarter ?? 2;
  const foulsBeforeBonus = game?.foulsBeforeBonus ?? 5;
  const remainingTimeouts = getRemainingTimeouts(
    periodStats.timeoutsUsed,
    timeoutsPerQuarter,
  );
  const inBonus = periodStats.teamFouls >= foulsBeforeBonus;
  const isLarge = size === "lg";

  return (
    <div
      className={cn(
        "flex items-center",
        isLarge ? "gap-4 md:gap-5" : "gap-2.5",
        align === "end" && "justify-end",
        className,
      )}
    >
      <RemainingTimeoutsCard
        remaining={remainingTimeouts}
        size={size}
        teamColor={teamColor}
      />
      <FoulBars
        barCount={foulsBeforeBonus}
        fouls={periodStats.teamFouls}
        litClassName={inBonus ? "bg-red-500" : "bg-amber-500"}
        size={size}
        unlitClassName={isLarge ? "bg-white/25" : "bg-muted-foreground/20"}
      />
    </div>
  );
}
