import type { BuzzerReason } from "@repo/shared";

const REALTIME_URL = process.env.REALTIME_URL ?? "http://localhost:3001";
const REALTIME_PUBLISH_SECRET =
  process.env.REALTIME_PUBLISH_SECRET ?? process.env.AUTH_SECRET ?? "";

type PublishPayload =
  | {
      type: "statsheet:update";
      gameId: number;
      sourceId?: string;
    }
  | {
      type: "clock:state";
      gameId: number;
    }
  | {
      type: "buzzer:play";
      gameId: number;
      reason: BuzzerReason;
      durationMs?: number;
    };

async function publish(payload: PublishPayload) {
  if (!REALTIME_PUBLISH_SECRET) {
    return;
  }

  try {
    await fetch(`${REALTIME_URL}/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${REALTIME_PUBLISH_SECRET}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Realtime server may not be running during local dev without the service.
  }
}

export async function publishStatsheetUpdate(
  gameId: number,
  sourceId?: string,
) {
  await publish({ type: "statsheet:update", gameId, sourceId });
}

export async function publishClockState(gameId: number) {
  await publish({ type: "clock:state", gameId });
}

const AUTO_BUZZER_MS = 3000;

export async function publishBuzzer(gameId: number, reason: BuzzerReason) {
  await publish({
    type: "buzzer:play",
    gameId,
    reason,
    durationMs: AUTO_BUZZER_MS,
  });
}
