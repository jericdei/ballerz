"use client";

import { useStatsheetMutations } from "@/components/statsheet/statsheet-mutations-context";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";

const statusStyles: Record<string, string> = {
  scheduled: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  in_progress: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  halftime: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  final: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
};

const realtimeStyles: Record<string, string> = {
  connecting: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  live: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  reconnecting: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  offline: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
};

export function StatsheetStatusBadges() {
  const game = useStatsheetStore((state) => state.game);
  const { isSyncing, isUndoing, isFinishing, realtimeStatus, presence } =
    useStatsheetMutations();

  if (!game) {
    return null;
  }

  const statusLabel = game.status.replaceAll("_", " ");
  const realtimeLabel =
    realtimeStatus === "live"
      ? presence > 1
        ? `Live · ${presence} devices`
        : "Live"
      : realtimeStatus === "connecting"
        ? "Connecting..."
        : realtimeStatus === "reconnecting"
          ? "Reconnecting..."
          : "Offline";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        className={cn(
          "capitalize",
          statusStyles[game.status] ?? "bg-muted text-muted-foreground",
        )}
        variant="secondary"
      >
        {statusLabel}
      </Badge>

      <Badge className={cn(realtimeStyles[realtimeStatus])} variant="secondary">
        {realtimeLabel}
      </Badge>

      {isSyncing ? (
        <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300">
          Syncing...
        </Badge>
      ) : null}

      {isUndoing ? (
        <Badge className="bg-violet-500/15 text-violet-700 dark:text-violet-300">
          Undoing...
        </Badge>
      ) : null}

      {isFinishing ? (
        <Badge className="bg-violet-500/15 text-violet-700 dark:text-violet-300">
          Finishing...
        </Badge>
      ) : null}
    </div>
  );
}
