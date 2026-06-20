import type { ServerWebSocket } from "bun";

import {
  applyClockTick,
  getResetGameClockMs,
  loadCanEditClockConfigs,
  loadClockState,
  updateClockState,
} from "@repo/api/clock-state";
import { verifyRealtimeToken } from "@repo/api/realtime-token";
import type {
  ClockCommand,
  RealtimeClientMessage,
  RealtimeServerMessage,
} from "@repo/shared";
import { canStartShotClock, isShotClockEligible } from "@repo/shared";

type ClientData = {
  gameId: number;
  userId: number;
};

const PORT = Number(process.env.REALTIME_PORT ?? 3001);
const AUTH_SECRET = process.env.AUTH_SECRET ?? "";
const PUBLISH_SECRET =
  process.env.REALTIME_PUBLISH_SECRET ?? process.env.AUTH_SECRET ?? "";

const rooms = new Map<number, Set<ServerWebSocket<ClientData>>>();
const activeClockGames = new Set<number>();

function getRoom(gameId: number) {
  let room = rooms.get(gameId);
  if (!room) {
    room = new Set();
    rooms.set(gameId, room);
  }

  return room;
}

function broadcast(gameId: number, message: RealtimeServerMessage) {
  const payload = JSON.stringify(message);
  for (const client of getRoom(gameId)) {
    client.send(payload);
  }
}

function broadcastPresence(gameId: number) {
  broadcast(gameId, {
    type: "presence",
    gameId,
    presence: getRoom(gameId).size,
  });
}

function send(ws: ServerWebSocket<ClientData>, message: RealtimeServerMessage) {
  ws.send(JSON.stringify(message));
}

async function handleClockCommand(gameId: number, command: ClockCommand) {
  const current = await loadClockState(gameId);
  if (!current) {
    return;
  }

  switch (command.action) {
    case "start":
      await updateClockState(gameId, {
        gameClockRunning: true,
        shotClockRunning: canStartShotClock(current),
        periodStarted: true,
      });
      break;
    case "stop":
      await updateClockState(gameId, {
        gameClockRunning: false,
        shotClockRunning: false,
      });
      break;
    case "startGameClock":
      await updateClockState(gameId, {
        gameClockRunning: true,
        periodStarted: true,
      });
      break;
    case "stopGameClock":
      await updateClockState(gameId, {
        gameClockRunning: false,
        ...(current.gameClockMs <= 24_000 ? { shotClockRunning: false } : {}),
      });
      break;
    case "startShotClock":
      if (canStartShotClock(current)) {
        await updateClockState(gameId, {
          shotClockRunning: true,
        });
      }
      break;
    case "stopShotClock":
      await updateClockState(gameId, {
        shotClockRunning: false,
      });
      break;
    case "resetGameClock": {
      const gameClockMs = await getResetGameClockMs(gameId);
      if (gameClockMs == null) {
        break;
      }

      await updateClockState(gameId, {
        gameClockMs,
        gameClockRunning: false,
        shotClockRunning: false,
      });
      break;
    }
    case "resetShotClock":
      if (isShotClockEligible(current.gameClockMs)) {
        await updateClockState(gameId, {
          shotClockMs: current.shotClockSeconds * 1000,
        });
      }
      break;
    case "setQuarterDuration": {
      if (!(await loadCanEditClockConfigs(gameId))) {
        break;
      }

      await updateClockState(gameId, {
        quarterDurationSeconds: command.seconds,
      });
      break;
    }
    case "setOvertimeDuration": {
      if (!(await loadCanEditClockConfigs(gameId))) {
        break;
      }

      await updateClockState(gameId, {
        overtimeDurationSeconds: command.seconds,
      });
      break;
    }
    case "setShotClockSeconds":
      if (isShotClockEligible(current.gameClockMs)) {
        await updateClockState(gameId, {
          shotClockSeconds: command.seconds,
          shotClockMs: command.seconds * 1000,
        });
      }
      break;
    case "startBuzzer":
      broadcast(gameId, {
        type: "buzzer:play",
        gameId,
        reason: "manual",
      });
      return;
    case "stopBuzzer":
      broadcast(gameId, { type: "buzzer:stop", gameId });
      return;
  }

  const clock = await loadClockState(gameId);
  if (clock) {
    if (clock.gameClockRunning || clock.shotClockRunning) {
      activeClockGames.add(gameId);
    } else {
      activeClockGames.delete(gameId);
    }

    broadcast(gameId, { type: "clock:state", gameId, clock });
  }
}

async function publishStatsheetUpdate(gameId: number, sourceId?: string) {
  broadcast(gameId, {
    type: "statsheet:update",
    gameId,
    sourceId,
  });
}

async function publishClockState(gameId: number) {
  const clock = await loadClockState(gameId);
  if (!clock) {
    return;
  }

  if (clock.gameClockRunning || clock.shotClockRunning) {
    activeClockGames.add(gameId);
  }

  broadcast(gameId, { type: "clock:state", gameId, clock });
}

setInterval(async () => {
  for (const gameId of [...activeClockGames]) {
    const clock = await applyClockTick(gameId, 100);
    if (!clock) {
      activeClockGames.delete(gameId);
      continue;
    }

    if (!clock.gameClockRunning && !clock.shotClockRunning) {
      activeClockGames.delete(gameId);
    }

    broadcast(gameId, { type: "clock:state", gameId, clock });
  }
}, 100);

const server = Bun.serve<ClientData>({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/publish" && req.method === "POST") {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.replace(/^Bearer\s+/i, "") ?? "";

      if (!PUBLISH_SECRET || token !== PUBLISH_SECRET) {
        return new Response("Unauthorized", { status: 401 });
      }

      return req.json().then(async (body) => {
        if (body.type === "statsheet:update") {
          await publishStatsheetUpdate(body.gameId, body.sourceId);
        } else if (body.type === "clock:state") {
          await publishClockState(body.gameId);
        } else if (body.type === "buzzer:play") {
          broadcast(body.gameId, {
            type: "buzzer:play",
            gameId: body.gameId,
            reason: body.reason,
            durationMs: body.durationMs,
          });
        }

        return Response.json({ ok: true });
      });
    }

    if (url.pathname === "/ws") {
      if (server.upgrade(req, { data: { gameId: 0, userId: 0 } })) {
        return undefined;
      }

      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    if (url.pathname === "/health") {
      return Response.json({ ok: true });
    }

    return new Response("Not found", { status: 404 });
  },
  websocket: {
    open(_ws) {
      // Wait for join message before adding to room.
    },
    async message(ws, message) {
      let parsed: RealtimeClientMessage;

      try {
        parsed = JSON.parse(String(message)) as RealtimeClientMessage;
      } catch {
        send(ws, { type: "error", message: "Invalid message" });
        return;
      }

      if (parsed.type === "join") {
        if (!AUTH_SECRET) {
          send(ws, { type: "error", message: "Auth is not configured" });
          return;
        }

        const payload = verifyRealtimeToken(parsed.token, AUTH_SECRET);
        if (!payload || payload.gameId !== parsed.gameId) {
          send(ws, { type: "error", message: "Invalid token" });
          return;
        }

        ws.data = { gameId: parsed.gameId, userId: payload.userId };
        getRoom(parsed.gameId).add(ws);

        const clock = await loadClockState(parsed.gameId);
        if (clock) {
          send(ws, { type: "clock:state", gameId: parsed.gameId, clock });
        }

        send(ws, {
          type: "joined",
          gameId: parsed.gameId,
          presence: getRoom(parsed.gameId).size,
        });
        broadcastPresence(parsed.gameId);
        return;
      }

      if (!ws.data.gameId) {
        send(ws, { type: "error", message: "Join a game room first" });
        return;
      }

      if (parsed.type === "clock:command") {
        if (parsed.gameId !== ws.data.gameId) {
          send(ws, { type: "error", message: "Game mismatch" });
          return;
        }

        await handleClockCommand(parsed.gameId, parsed.command);
      }
    },
    close(ws) {
      const { gameId } = ws.data;
      if (!gameId) {
        return;
      }

      getRoom(gameId).delete(ws);
      if (getRoom(gameId).size === 0) {
        rooms.delete(gameId);
      } else {
        broadcastPresence(gameId);
      }
    },
  },
});

console.log(`Realtime server listening on ${server.url}`);
