"use client";

import { RotateCcw, Save } from "lucide-react";

import { useStatsheetMutations } from "@/components/statsheet/statsheet-mutations-context";
import { Button } from "@/components/ui/button";
import { useStatsheetStore } from "@/stores/use-statsheet-store";

export function StatsheetHeaderActions() {
  const dirty = useStatsheetStore((state) => state.dirty);
  const eventLog = useStatsheetStore((state) => state.eventLog);
  const { isBusy, isSaving, isUndoing, error, save, undoLast } =
    useStatsheetMutations();

  const canUndoLast = eventLog.some((entry) => entry.canUndo);

  return (
    <div className="flex items-center gap-2">
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
      <Button
        className="gap-1.5"
        disabled={!dirty || isBusy}
        onClick={save}
        size="sm"
        type="button"
      >
        <Save className="size-3.5" />
        {isSaving ? "Saving..." : "Save"}
      </Button>
      {error ? (
        <span className="max-w-48 truncate text-sm text-destructive">
          {error.message}
        </span>
      ) : null}
    </div>
  );
}
