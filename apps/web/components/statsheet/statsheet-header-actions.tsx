"use client";

import { RotateCcw } from "lucide-react";

import { FinishGameButton } from "@/components/statsheet/finish-game-button";
import { useStatsheetMutations } from "@/components/statsheet/statsheet-mutations-context";
import { StatsheetViewToggle } from "@/components/statsheet/statsheet-view-toggle";
import { Button } from "@/components/ui/button";
import { isActiveGameStatus } from "@/lib/statsheet-utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";

export function StatsheetHeaderActions() {
  const status = useStatsheetStore((state) => state.status);
  const eventLog = useStatsheetStore((state) => state.eventLog);
  const { isBusy, isUndoing, error, undoLast } = useStatsheetMutations();

  const canUndoLast =
    isActiveGameStatus(status) && eventLog.some((entry) => entry.canUndo);

  return (
    <div className="flex items-center gap-2">
      <StatsheetViewToggle />
      {isActiveGameStatus(status) ? (
        <>
          <Button
            className="gap-1.5"
            disabled={!canUndoLast || isBusy}
            onClick={undoLast}
            size="sm"
            type="button"
            variant="outline"
          >
            <RotateCcw className="size-3.5" />
            {isUndoing ? "Undoing..." : "Undo"}
          </Button>
          <FinishGameButton />
        </>
      ) : null}
      {error ? (
        <span className="max-w-48 truncate text-sm text-destructive">
          {error.message}
        </span>
      ) : null}
    </div>
  );
}
