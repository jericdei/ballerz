"use client";

import { useMemo } from "react";
import { Clock, History } from "lucide-react";

import type { GamePeriod, GameStatEventType } from "@repo/shared";
import { formatClockMs } from "@repo/shared";

import {
  formatPeriodLabel,
  formatPlayerName,
  formatStatEventLabel,
} from "@/components/statsheet/statsheet-labels";
import { getStatButtonConfig } from "@/components/statsheet/statsheet-stat-config";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PlayByPlayEvent = {
  id: number;
  sequence: number;
  period: GamePeriod;
  eventType: GameStatEventType;
  playerId: number | null;
  teamId: number;
  occurredAt: Date;
  gameClockMs: number | null;
  firstName: string | null;
  lastName: string | null;
  reversesEventId: number | null;
};

type GamePlayByPlayProps = {
  events: PlayByPlayEvent[];
  firstTeamId: number;
  secondTeamId: number;
  firstTeamName: string | null;
  secondTeamName: string | null;
};

function statCategoryChip(
  category: NonNullable<ReturnType<typeof getStatButtonConfig>>["category"],
) {
  const chips: Record<string, string> = {
    scoring: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    playmaking: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    defense: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    fouls: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    turnovers: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    rebounds: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  };
  return chips[category] ?? "bg-muted text-muted-foreground";
}

export function GamePlayByPlay({
  events,
  firstTeamId,
  secondTeamId,
  firstTeamName,
  secondTeamName,
}: GamePlayByPlayProps) {
  const visibleEvents = useMemo(() => {
    const reversedIds = new Set(
      events
        .map((event) => event.reversesEventId)
        .filter((id): id is number => id != null),
    );

    return events
      .filter(
        (event) => event.reversesEventId == null && !reversedIds.has(event.id),
      )
      .sort((a, b) => b.sequence - a.sequence);
  }, [events]);

  const teamName = (teamId: number) => {
    if (teamId === firstTeamId) return firstTeamName ?? "Team 1";
    if (teamId === secondTeamId) return secondTeamName ?? "Team 2";
    return "Team";
  };

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <History className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Play-by-play
        </h3>
        <Badge className="ml-auto" variant="secondary">
          {visibleEvents.length}
        </Badge>
      </div>

      <div className="max-h-[640px] space-y-2 overflow-y-auto p-3">
        {visibleEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            <History className="mb-2 size-8 opacity-30" />
            <p>No events recorded for this game.</p>
          </div>
        ) : (
          visibleEvents.map((event) => {
            const config = getStatButtonConfig(event.eventType);
            const Icon = config?.icon;
            const playerName =
              event.firstName && event.lastName
                ? formatPlayerName(event.firstName, event.lastName)
                : null;

            return (
              <div
                className="flex gap-3 rounded-xl border bg-background p-3"
                key={event.id}
              >
                {Icon ? (
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      config ? statCategoryChip(config.category) : "bg-muted",
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                ) : null}

                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight">
                    {formatStatEventLabel(event.eventType)}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {playerName ?? teamName(event.teamId)}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {formatPeriodLabel(event.period)}
                    {event.gameClockMs != null ? (
                      <> · {formatClockMs(event.gameClockMs)}</>
                    ) : null}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
