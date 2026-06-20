"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { ClockCommand, RealtimeServerMessage } from "@repo/shared";

import {
  playGameBuzzerFor,
  startGameBuzzer,
  stopGameBuzzer,
} from "@/lib/play-game-buzzer";
import { useStatsheetStore } from "@/stores/use-statsheet-store";
import { useTRPC } from "@/trpc/client";

const REALTIME_WS_URL =
  process.env.NEXT_PUBLIC_REALTIME_WS_URL ?? "ws://localhost:3001/ws";

export type RealtimeConnectionStatus =
  | "connecting"
  | "live"
  | "reconnecting"
  | "offline";

type UseStatsheetRealtimeOptions = {
  gameId: number;
  sourceId: string;
  onRemoteStatsheetUpdate?: () => void;
};

export function useStatsheetRealtime({
  gameId,
  sourceId,
  onRemoteStatsheetUpdate,
}: UseStatsheetRealtimeOptions) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const hydrate = useStatsheetStore((state) => state.hydrate);
  const setClock = useStatsheetStore((state) => state.setClock);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [status, setStatus] = useState<RealtimeConnectionStatus>("connecting");
  const [presence, setPresence] = useState(0);

  const tokenQuery = useQuery(
    trpc.realtime.getConnectionToken.queryOptions({ gameId }),
  );

  useEffect(() => {
    const token = tokenQuery.data?.token;
    if (!token) {
      return;
    }

    let cancelled = false;

    function connect() {
      if (cancelled) {
        return;
      }

      setStatus((current) =>
        current === "live" ? "reconnecting" : "connecting",
      );

      const ws = new WebSocket(REALTIME_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "join",
            gameId,
            token,
          }),
        );
      };

      ws.onmessage = (event) => {
        let message: RealtimeServerMessage;
        try {
          message = JSON.parse(String(event.data)) as RealtimeServerMessage;
        } catch {
          return;
        }

        if (message.type === "joined") {
          setStatus("live");
          setPresence(message.presence);
          return;
        }

        if (message.type === "presence") {
          setPresence(message.presence);
          return;
        }

        if (message.type === "clock:state") {
          setClock(message.clock);
          return;
        }

        if (message.type === "buzzer:play") {
          if (message.durationMs != null) {
            void playGameBuzzerFor(message.durationMs);
          } else {
            void startGameBuzzer();
          }
          return;
        }

        if (message.type === "buzzer:stop") {
          stopGameBuzzer();
          return;
        }

        if (message.type === "statsheet:update") {
          if (message.sourceId === sourceId) {
            return;
          }

          void (async () => {
            await queryClient.invalidateQueries(
              trpc.statsheet.getState.queryFilter({ gameId }),
            );
            const snapshot = await queryClient.fetchQuery({
              ...trpc.statsheet.getState.queryOptions({ gameId }),
              staleTime: 0,
            });
            hydrate(snapshot);
            onRemoteStatsheetUpdate?.();
          })();
        }
      };

      ws.onclose = () => {
        if (cancelled) {
          return;
        }

        setStatus("reconnecting");
        reconnectTimeoutRef.current = setTimeout(connect, 1500);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
      wsRef.current = null;
      setStatus("offline");
    };
  }, [
    gameId,
    hydrate,
    onRemoteStatsheetUpdate,
    queryClient,
    setClock,
    sourceId,
    tokenQuery.data?.token,
    trpc.statsheet.getState,
  ]);

  function sendClockCommand(command: ClockCommand) {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    ws.send(
      JSON.stringify({
        type: "clock:command",
        gameId,
        command,
      }),
    );
  }

  return {
    status,
    presence,
    sendClockCommand,
  };
}
