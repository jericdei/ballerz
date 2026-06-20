"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useStatsheetStore } from "@/stores/use-statsheet-store";
import { useTRPC } from "@/trpc/client";

type StatsheetSnapshot = Parameters<
  ReturnType<typeof useStatsheetStore.getState>["hydrate"]
>[0];

type StatsheetMutationsContextValue = {
  isBusy: boolean;
  isSaving: boolean;
  isUndoing: boolean;
  isFinishing: boolean;
  undoingEventId: number | null;
  error: { message: string } | null;
  save: () => void;
  finishGame: () => void;
  undoEvent: (eventId: number) => void;
  undoLast: () => void;
};

const StatsheetMutationsContext =
  createContext<StatsheetMutationsContextValue | null>(null);

export function useStatsheetMutations() {
  const context = useContext(StatsheetMutationsContext);
  if (!context) {
    throw new Error(
      "useStatsheetMutations must be used within StatsheetMutationsProvider",
    );
  }
  return context;
}

type StatsheetMutationsProviderProps = {
  gameId: number;
  children: ReactNode;
};

function hydrateFromSnapshot(
  snapshot: StatsheetSnapshot,
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

export function StatsheetMutationsProvider({
  gameId,
  children,
}: StatsheetMutationsProviderProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const eventLog = useStatsheetStore((state) => state.eventLog);
  const getSyncPayload = useStatsheetStore((state) => state.getSyncPayload);
  const hydrate = useStatsheetStore((state) => state.hydrate);
  const undoPending = useStatsheetStore((state) => state.undoPending);
  const [undoingEventId, setUndoingEventId] = useState<number | null>(null);

  const syncMutation = useMutation(
    trpc.statsheet.sync.mutationOptions({
      onSuccess: (snapshot) => {
        hydrateFromSnapshot(snapshot, hydrate);
      },
    }),
  );

  const finishMutation = useMutation(
    trpc.statsheet.finish.mutationOptions({
      onSuccess: async (snapshot) => {
        hydrateFromSnapshot(snapshot, hydrate);

        const leagueId = snapshot.game.leagueId;
        if (leagueId != null) {
          await queryClient.invalidateQueries(
            trpc.games.listByLeague.queryFilter({ leagueId }),
          );
          await queryClient.invalidateQueries(
            trpc.leagues.leaders.queryFilter({ id: leagueId }),
          );
        }
      },
    }),
  );

  const reverseMutation = useMutation(
    trpc.statsheet.reverse.mutationOptions({
      onSuccess: (snapshot) => {
        hydrateFromSnapshot(snapshot, hydrate);
      },
      onSettled: () => {
        setUndoingEventId(null);
      },
    }),
  );

  const isSaving = syncMutation.isPending;
  const isFinishing = finishMutation.isPending;
  const isUndoing = reverseMutation.isPending;
  const isBusy = isSaving || isFinishing || isUndoing;
  const error =
    syncMutation.error ?? finishMutation.error ?? reverseMutation.error;

  function save() {
    const payload = getSyncPayload();
    syncMutation.mutate({
      gameId,
      currentPeriod: payload.currentPeriod,
      status: payload.status,
      events: payload.events,
    });
  }

  function finishGame() {
    const payload = getSyncPayload();
    finishMutation.mutate({
      gameId,
      currentPeriod: payload.currentPeriod,
      events: payload.events,
    });
  }

  function undoEvent(eventId: number) {
    setUndoingEventId(eventId);
    reverseMutation.mutate({ gameId, eventId });
  }

  function undoLast() {
    const entry = eventLog.find((item) => item.canUndo);
    if (!entry) return;

    if (!entry.synced) {
      undoPending(entry.clientId);
      return;
    }

    if (entry.id == null) return;

    undoEvent(entry.id);
  }

  return (
    <StatsheetMutationsContext.Provider
      value={{
        isBusy,
        isSaving,
        isUndoing,
        isFinishing,
        undoingEventId,
        error,
        save,
        finishGame,
        undoEvent,
        undoLast,
      }}
    >
      {children}
    </StatsheetMutationsContext.Provider>
  );
}
