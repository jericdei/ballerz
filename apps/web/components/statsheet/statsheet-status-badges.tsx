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

export function StatsheetStatusBadges() {
  const game = useStatsheetStore((state) => state.game);
  const dirty = useStatsheetStore((state) => state.dirty);
  const { isSaving, isUndoing, isFinishing } = useStatsheetMutations();

  if (!game) {
    return null;
  }

  const statusLabel = game.status.replaceAll("_", " ");

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

      {dirty ? (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">
          Unsaved changes
        </Badge>
      ) : null}

      {isSaving ? (
        <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300">
          Saving...
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
