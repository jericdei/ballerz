"use client";

import { useMutation } from "@tanstack/react-query";
import { RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useStatsheetStore } from "@/stores/use-statsheet-store";
import { useTRPC } from "@/trpc/client";

type StatsheetHeaderActionsProps = {
  gameId: number;
};

function hydrateFromSnapshot(
  snapshot: {
    game: Parameters<
      ReturnType<typeof useStatsheetStore.getState>["hydrate"]
    >[0]["game"];
    rosters: Parameters<
      ReturnType<typeof useStatsheetStore.getState>["hydrate"]
    >[0]["rosters"];
    playerStats: Parameters<
      ReturnType<typeof useStatsheetStore.getState>["hydrate"]
    >[0]["playerStats"];
    teamPeriodStats: Parameters<
      ReturnType<typeof useStatsheetStore.getState>["hydrate"]
    >[0]["teamPeriodStats"];
    events: Parameters<
      ReturnType<typeof useStatsheetStore.getState>["hydrate"]
    >[0]["events"];
  },
  hydrate: ReturnType<typeof useStatsheetStore.getState>["hydrate"],
) {
  hydrate({
    game: snapshot.game,
    rosters: snapshot.rosters,
    playerStats: snapshot.playerStats,
    teamPeriodStats: snapshot.teamPeriodStats,
    events: snapshot.events,
  });
}

export function StatsheetHeaderActions({
  gameId,
}: StatsheetHeaderActionsProps) {
  const trpc = useTRPC();
  const dirty = useStatsheetStore((state) => state.dirty);
  const eventLog = useStatsheetStore((state) => state.eventLog);
  const getSyncPayload = useStatsheetStore((state) => state.getSyncPayload);
  const hydrate = useStatsheetStore((state) => state.hydrate);
  const undoPending = useStatsheetStore((state) => state.undoPending);

  const canUndoLast = eventLog.some((entry) => entry.canUndo);

  const syncMutation = useMutation(
    trpc.statsheet.sync.mutationOptions({
      onSuccess: (snapshot) => {
        hydrateFromSnapshot(snapshot, hydrate);
      },
    }),
  );

  const reverseMutation = useMutation(
    trpc.statsheet.reverse.mutationOptions({
      onSuccess: (snapshot) => {
        hydrateFromSnapshot(snapshot, hydrate);
      },
    }),
  );

  const isBusy = syncMutation.isPending || reverseMutation.isPending;
  const error = syncMutation.error ?? reverseMutation.error;

  function handleSave() {
    const payload = getSyncPayload();
    syncMutation.mutate({
      gameId,
      currentPeriod: payload.currentPeriod,
      status: payload.status,
      events: payload.events,
    });
  }

  function handleUndoLast() {
    const entry = eventLog.find((item) => item.canUndo);
    if (!entry) return;

    if (!entry.synced) {
      undoPending(entry.clientId);
      return;
    }

    if (entry.id == null) return;

    reverseMutation.mutate({
      gameId,
      eventId: entry.id,
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        className="gap-1.5"
        disabled={!canUndoLast || isBusy}
        onClick={handleUndoLast}
        size="sm"
        type="button"
        variant="outline"
      >
        <RotateCcw className="size-3.5" />
        {reverseMutation.isPending ? "Undoing..." : "Undo"}
      </Button>
      <Button
        className="gap-1.5"
        disabled={!dirty || isBusy}
        onClick={handleSave}
        size="sm"
        type="button"
      >
        <Save className="size-3.5" />
        {syncMutation.isPending ? "Saving..." : "Save"}
      </Button>
      {error ? (
        <span className="max-w-48 truncate text-sm text-destructive">
          {error.message}
        </span>
      ) : null}
    </div>
  );
}
