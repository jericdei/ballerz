export type BuzzerReason = "manual" | "game_clock" | "shot_clock" | "timeout";

export type RealtimeClientMessage =
  | { type: "join"; gameId: number; token: string }
  | { type: "clock:command"; gameId: number; command: ClockCommand };

export type RealtimeServerMessage =
  | { type: "joined"; gameId: number; presence: number }
  | { type: "presence"; gameId: number; presence: number }
  | { type: "statsheet:update"; gameId: number; sourceId?: string }
  | { type: "clock:state"; gameId: number; clock: ClockState }
  | {
      type: "buzzer:play";
      gameId: number;
      reason: BuzzerReason;
      durationMs?: number;
    }
  | { type: "buzzer:stop"; gameId: number }
  | { type: "error"; message: string };

export type ClockCommand =
  | { action: "start" }
  | { action: "stop" }
  | { action: "startGameClock" }
  | { action: "stopGameClock" }
  | { action: "startShotClock" }
  | { action: "stopShotClock" }
  | { action: "resetGameClock" }
  | { action: "resetShotClock" }
  | { action: "setQuarterDuration"; seconds: number }
  | { action: "setOvertimeDuration"; seconds: number }
  | { action: "setShotClockSeconds"; seconds: number }
  | { action: "startBuzzer" }
  | { action: "stopBuzzer" };

export type ClockState = {
  quarterDurationSeconds: number;
  overtimeDurationSeconds: number;
  shotClockSeconds: number;
  gameClockMs: number;
  shotClockMs: number;
  gameClockRunning: boolean;
  shotClockRunning: boolean;
  periodStarted: boolean;
  updatedAt: string;
};

export function formatClockMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatShotClockMs(ms: number): string {
  return String(Math.max(0, Math.ceil(ms / 1000)));
}
