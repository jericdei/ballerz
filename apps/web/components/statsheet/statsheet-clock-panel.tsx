"use client";

import { Pause, Play, Timer } from "lucide-react";

import {
  formatClockMs,
  formatShotClockMs,
  canStartShotClock,
  isShotClockDisplayed,
  isShotClockEligible,
} from "@repo/shared";

import { StatsheetBuzzerButton } from "@/components/statsheet/statsheet-buzzer-button";
import { StatsheetClockSettingsDialog } from "@/components/statsheet/statsheet-clock-settings";
import { useStatsheetMutations } from "@/components/statsheet/statsheet-mutations-context";
import { isActiveGameStatus } from "@/lib/statsheet-utils";
import { cn } from "@/lib/utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";

type StatsheetClockPanelProps = {
  className?: string;
  compact?: boolean;
};

type ClockActionButtonProps = {
  accent: string;
  border: string;
  chip: string;
  className?: string;
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  subtitle?: string;
};

function ClockActionButton({
  accent,
  border,
  chip,
  className,
  disabled = false,
  icon: Icon,
  label,
  onClick,
  subtitle,
}: ClockActionButtonProps) {
  return (
    <button
      className={cn(
        "group flex min-h-18 w-full flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center transition-colors md:min-h-20 md:gap-1.5 md:p-4",
        "disabled:cursor-not-allowed disabled:opacity-40",
        border,
        chip,
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon className={cn("size-6 md:size-7", accent)} />
      <span className="text-sm font-bold leading-tight md:text-base">
        {label}
      </span>
      {subtitle ? (
        <span className="text-[11px] font-medium text-muted-foreground md:text-xs">
          {subtitle}
        </span>
      ) : null}
    </button>
  );
}

function ClockDisplay({
  className,
  dimmed = false,
  label,
  value,
  valueClassName,
}: {
  className?: string;
  dimmed?: boolean;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center rounded-xl bg-muted/40 p-4 text-center md:p-5",
        dimmed && "opacity-50",
        className,
      )}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground md:text-sm">
        {label}
      </p>
      <p
        className={cn(
          "font-mono text-5xl font-bold tabular-nums md:text-6xl lg:text-7xl",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function StatsheetClockPanel({
  className,
  compact = false,
}: StatsheetClockPanelProps) {
  const status = useStatsheetStore((state) => state.status);
  const game = useStatsheetStore((state) => state.game);
  const clock = useStatsheetStore((state) => state.clock);
  const { isBusy, sendClockCommand } = useStatsheetMutations();

  if (!clock || !isActiveGameStatus(status)) {
    return null;
  }

  const isRunning = clock.gameClockRunning || clock.shotClockRunning;
  const shotClockDisplayed = isShotClockDisplayed(clock);
  const shotClockEligible = isShotClockEligible(clock.gameClockMs);
  const canRunShot = canStartShotClock(clock);
  const shotButtonActive = canRunShot || clock.shotClockRunning;

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-background/80 px-3 py-2">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Game
          </p>
          <p className="font-mono text-lg font-semibold tabular-nums">
            {formatClockMs(clock.gameClockMs)}
          </p>
        </div>
        {shotClockDisplayed ? (
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Shot
            </p>
            <p className="font-mono text-lg font-semibold tabular-nums text-amber-600 dark:text-amber-400">
              {formatShotClockMs(clock.shotClockMs)}
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  function setShotClock(seconds: number) {
    sendClockCommand({ action: "setShotClockSeconds", seconds });
  }

  return (
    <section
      className={cn(
        "grid h-full min-h-0 grid-cols-1 gap-4 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-2 md:gap-6 md:p-5",
        className,
      )}
    >
      <div className="flex min-h-0 flex-col gap-3 md:gap-4">
        <div className="flex items-center gap-2">
          <Timer className="size-5 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider md:text-base">
            Clocks
          </h2>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3 md:gap-4">
          <ClockDisplay
            label="Quarter"
            value={formatClockMs(clock.gameClockMs)}
          />
          <ClockDisplay
            dimmed={!shotClockDisplayed}
            label="Shot Clock"
            value={
              shotClockDisplayed ? formatShotClockMs(clock.shotClockMs) : "OFF"
            }
            valueClassName={
              shotClockDisplayed
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
            }
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-4 overflow-x-hidden overflow-y-auto md:gap-5">
        <ClockActionButton
          accent={
            isRunning
              ? "text-rose-600 dark:text-rose-400"
              : "text-emerald-600 dark:text-emerald-400"
          }
          border={
            isRunning
              ? "border-rose-500/30 hover:border-rose-500/50"
              : "border-emerald-500/30 hover:border-emerald-500/50"
          }
          chip={
            isRunning
              ? "bg-rose-500/10 hover:bg-rose-500/20"
              : "bg-emerald-500/10 hover:bg-emerald-500/20"
          }
          disabled={isBusy}
          icon={isRunning ? Pause : Play}
          label={isRunning ? "Stop Both" : "Start Both"}
          onClick={() =>
            sendClockCommand({ action: isRunning ? "stop" : "start" })
          }
          subtitle={isRunning ? "Pause both clocks" : "Run both clocks"}
        />

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <ClockActionButton
            accent={
              clock.gameClockRunning
                ? "text-sky-600 dark:text-sky-400"
                : "text-slate-600 dark:text-slate-400"
            }
            border={
              clock.gameClockRunning
                ? "border-sky-500/30 hover:border-sky-500/50"
                : "border-slate-500/30 hover:border-slate-500/50"
            }
            chip={
              clock.gameClockRunning
                ? "bg-sky-500/10 hover:bg-sky-500/20"
                : "bg-slate-500/10 hover:bg-slate-500/20"
            }
            disabled={isBusy}
            icon={clock.gameClockRunning ? Pause : Play}
            label={clock.gameClockRunning ? "Pause Game" : "Run Game"}
            onClick={() =>
              sendClockCommand({
                action: clock.gameClockRunning
                  ? "stopGameClock"
                  : "startGameClock",
              })
            }
            subtitle="Quarter clock"
          />

          <ClockActionButton
            accent={
              !shotButtonActive
                ? "text-muted-foreground"
                : clock.shotClockRunning
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-orange-600 dark:text-orange-400"
            }
            border={
              !shotButtonActive
                ? "border-border"
                : clock.shotClockRunning
                  ? "border-amber-500/30 hover:border-amber-500/50"
                  : "border-orange-500/30 hover:border-orange-500/50"
            }
            chip={
              !shotButtonActive
                ? "bg-muted/30"
                : clock.shotClockRunning
                  ? "bg-amber-500/10 hover:bg-amber-500/20"
                  : "bg-orange-500/10 hover:bg-orange-500/20"
            }
            disabled={isBusy || !shotButtonActive}
            icon={clock.shotClockRunning ? Pause : Play}
            label={
              !shotButtonActive
                ? "Shot Off"
                : clock.shotClockRunning
                  ? "Pause Shot"
                  : "Run Shot"
            }
            onClick={() =>
              sendClockCommand({
                action: clock.shotClockRunning
                  ? "stopShotClock"
                  : "startShotClock",
              })
            }
            subtitle={
              !shotClockDisplayed && !clock.shotClockRunning
                ? "Under 24 seconds"
                : "Shot clock"
            }
          />

          <ClockActionButton
            accent="text-amber-600 dark:text-amber-400"
            border="border-amber-500/30 hover:border-amber-500/50"
            chip="bg-amber-500/10 hover:bg-amber-500/20"
            disabled={isBusy || !shotClockEligible}
            icon={Timer}
            label="24"
            onClick={() => setShotClock(24)}
            subtitle="Shot clock"
          />

          <ClockActionButton
            accent="text-orange-600 dark:text-orange-400"
            border="border-orange-500/30 hover:border-orange-500/50"
            chip="bg-orange-500/10 hover:bg-orange-500/20"
            disabled={isBusy || !shotClockEligible}
            icon={Timer}
            label="14"
            onClick={() => setShotClock(14)}
            subtitle="Shot clock"
          />

          <div className="col-span-2">
            <StatsheetBuzzerButton layout="tablet" />
          </div>
        </div>

        {game ? <StatsheetClockSettingsDialog gameId={game.id} /> : null}
      </div>
    </section>
  );
}
