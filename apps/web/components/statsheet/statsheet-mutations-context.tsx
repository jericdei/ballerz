"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type ClockCommand } from "@repo/shared";

import {
  type RealtimeConnectionStatus,
  useStatsheetRealtime,
} from "@/hooks/use-statsheet-realtime";
import { createClientId } from "@/lib/client-id";
import { startGameBuzzer, stopGameBuzzer } from "@/lib/play-game-buzzer";
import { useStatsheetStore } from "@/stores/use-statsheet-store";
import { useTRPC } from "@/trpc/client";

type StatsheetSnapshot = Parameters<
  ReturnType<typeof useStatsheetStore.getState>["hydrate"]
>[0];

type StatsheetMutationsContextValue = {
  sourceId: string;
  isBusy: boolean;
  isSyncing: boolean;
  isUndoing: boolean;
  isFinishing: boolean;
  undoingEventId: number | null;
  error: { message: string } | null;
  realtimeStatus: RealtimeConnectionStatus;
  presence: number;
  finishGame: () => void;
  undoEvent: (eventId: number) => void;
  undoLast: () => void;
  sendClockCommand: (command: ClockCommand) => void;
  startBuzzer: () => void;
  stopBuzzer: () => void;
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
  const sourceId = useMemo(() => createClientId(), []);
  const eventLog = useStatsheetStore((state) => state.eventLog);
  const pendingEvents = useStatsheetStore((state) => state.pendingEvents);
  const getSyncPayload = useStatsheetStore((state) => state.getSyncPayload);
  const hydrate = useStatsheetStore((state) => state.hydrate);
  const undoPending = useStatsheetStore((state) => state.undoPending);
  const [undoingEventId, setUndoingEventId] = useState<number | null>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncInFlightRef = useRef(false);
  const syncQueuedRef = useRef(false);

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

  const flushSync = useCallback(() => {
    const payload = getSyncPayload();
    if (payload.events.length === 0) {
      return;
    }

    if (syncInFlightRef.current) {
      syncQueuedRef.current = true;
      return;
    }

    syncInFlightRef.current = true;
    syncMutation.mutate(
      {
        gameId,
        currentPeriod: payload.currentPeriod,
        status: payload.status,
        events: payload.events,
        sourceId,
      },
      {
        onSettled: () => {
          syncInFlightRef.current = false;
          if (syncQueuedRef.current || getSyncPayload().events.length > 0) {
            syncQueuedRef.current = false;
            flushSync();
          }
        },
      },
    );
  }, [gameId, getSyncPayload, sourceId, syncMutation]);

  const scheduleSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      flushSync();
    }, 250);
  }, [flushSync]);

  useEffect(() => {
    if (pendingEvents.length === 0) {
      return;
    }

    scheduleSync();
  }, [pendingEvents, scheduleSync]);

  useEffect(
    () => () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    },
    [],
  );

  const {
    status: realtimeStatus,
    presence,
    sendClockCommand,
  } = useStatsheetRealtime({
    gameId,
    sourceId,
  });

  const isSyncing = syncMutation.isPending;
  const isFinishing = finishMutation.isPending;
  const isUndoing = reverseMutation.isPending;
  const isBusy = isSyncing || isFinishing || isUndoing;
  const error =
    syncMutation.error ?? finishMutation.error ?? reverseMutation.error;

  function finishGame() {
    const payload = getSyncPayload();
    finishMutation.mutate({
      gameId,
      currentPeriod: payload.currentPeriod,
      events: payload.events,
      sourceId,
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

  function startBuzzer() {
    void startGameBuzzer();
    sendClockCommand({ action: "startBuzzer" });
  }

  function stopBuzzer() {
    stopGameBuzzer();
    sendClockCommand({ action: "stopBuzzer" });
  }

  return (
    <StatsheetMutationsContext.Provider
      value={{
        sourceId,
        isBusy,
        isSyncing,
        isUndoing,
        isFinishing,
        undoingEventId,
        error,
        realtimeStatus,
        presence,
        finishGame,
        undoEvent,
        undoLast,
        sendClockCommand,
        startBuzzer,
        stopBuzzer,
      }}
    >
      {children}
    </StatsheetMutationsContext.Provider>
  );
}
