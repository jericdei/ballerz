"use client";

import { Clock, History, Loader2, Undo2 } from "lucide-react";

import { formatClockMs } from "@repo/shared";

import { formatPeriodLabel } from "@/components/statsheet/statsheet-labels";
import { useStatsheetMutations } from "@/components/statsheet/statsheet-mutations-context";
import { getStatButtonConfig } from "@/components/statsheet/statsheet-stat-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isActiveGameStatus } from "@/lib/statsheet-utils";
import { cn } from "@/lib/utils";
import type { StatsheetEventLogEntry } from "@/stores/use-statsheet-store";
import { useStatsheetStore } from "@/stores/use-statsheet-store";

function StatsheetEventLogRow({
  entry,
  teamName,
}: {
  entry: StatsheetEventLogEntry;
  teamName: (teamId: number) => string;
}) {
  const undoPending = useStatsheetStore((state) => state.undoPending);
  const status = useStatsheetStore((state) => state.status);
  const { isBusy, isUndoing, undoingEventId, undoEvent, error } =
    useStatsheetMutations();
  const canUndo = isActiveGameStatus(status) && !isBusy;
  const config = getStatButtonConfig(entry.eventType);
  const Icon = config?.icon;
  const isUndoingThisRow =
    isUndoing && entry.id != null && undoingEventId === entry.id;

  function handleUndo() {
    if (!entry.canUndo) return;

    if (!entry.synced) {
      undoPending(entry.clientId);
      return;
    }

    if (entry.id == null) return;

    undoEvent(entry.id);
  }

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border bg-background p-3 transition-colors",
        !entry.synced && "border-amber-500/40 bg-amber-500/5",
      )}
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
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold leading-tight">{entry.label}</p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {entry.playerName ?? teamName(entry.teamId)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!entry.synced ? (
              <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300">
                Syncing
              </Badge>
            ) : null}
            {entry.canUndo ? (
              <Button
                className="size-7"
                disabled={!canUndo}
                onClick={handleUndo}
                size="icon"
                title="Undo"
                type="button"
                variant="ghost"
              >
                {isUndoingThisRow ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Undo2 className="size-3.5" />
                )}
              </Button>
            ) : null}
          </div>
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" />
          {formatPeriodLabel(entry.period)}
          {entry.gameClockMs != null ? (
            <> · {formatClockMs(entry.gameClockMs)}</>
          ) : null}
        </p>
        {isUndoingThisRow && error ? (
          <p className="mt-1 text-xs text-destructive">{error.message}</p>
        ) : null}
      </div>
    </div>
  );
}

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

export function StatsheetEventLog() {
  const eventLog = useStatsheetStore((state) => state.eventLog);
  const game = useStatsheetStore((state) => state.game);

  const teamName = (teamId: number) => {
    if (!game) return "Team";
    if (teamId === game.firstTeamId) return game.firstTeamName ?? "Team 1";
    if (teamId === game.secondTeamId) return game.secondTeamName ?? "Team 2";
    return "Team";
  };

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden border-t bg-card/30 xl:border-t-0 xl:border-l">
      <div className="flex shrink-0 items-center gap-2 border-b p-3 sm:p-4">
        <History className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Play-by-play
        </h2>
        <Badge className="ml-auto" variant="secondary">
          {eventLog.length}
        </Badge>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {eventLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            <History className="mb-2 size-8 opacity-30" />
            <p>No events yet.</p>
            <p className="mt-1 text-xs">Recorded stats appear here.</p>
          </div>
        ) : (
          eventLog.map((entry) => (
            <StatsheetEventLogRow
              entry={entry}
              key={entry.clientId}
              teamName={teamName}
            />
          ))
        )}
      </div>
    </aside>
  );
}
