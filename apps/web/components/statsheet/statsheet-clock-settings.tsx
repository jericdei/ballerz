"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import {
  canEditClockConfigs,
  DEFAULT_FOULS_BEFORE_BONUS,
  DEFAULT_OVERTIME_DURATION_SECONDS,
  DEFAULT_TIMEOUTS_PER_QUARTER,
} from "@repo/shared";

import { useStatsheetMutations } from "@/components/statsheet/statsheet-mutations-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isActiveGameStatus } from "@/lib/statsheet-utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";
import { useTRPC } from "@/trpc/client";

type StatsheetClockSettingsDialogProps = {
  gameId: number;
};

export function StatsheetClockSettingsDialog({
  gameId,
}: StatsheetClockSettingsDialogProps) {
  const trpc = useTRPC();
  const game = useStatsheetStore((state) => state.game);
  const clock = useStatsheetStore((state) => state.clock);
  const currentPeriod = useStatsheetStore((state) => state.currentPeriod);
  const status = useStatsheetStore((state) => state.status);
  const hydrate = useStatsheetStore((state) => state.hydrate);
  const { isBusy } = useStatsheetMutations();
  const [open, setOpen] = useState(false);

  const [quarterMinutes, setQuarterMinutes] = useState(10);
  const [overtimeMinutes, setOvertimeMinutes] = useState(
    DEFAULT_OVERTIME_DURATION_SECONDS / 60,
  );
  const [timeoutsPerQuarter, setTimeoutsPerQuarter] = useState(
    DEFAULT_TIMEOUTS_PER_QUARTER,
  );
  const [foulsBeforeBonus, setFoulsBeforeBonus] = useState(
    DEFAULT_FOULS_BEFORE_BONUS,
  );

  const updateRulesMutation = useMutation(
    trpc.statsheet.updateRules.mutationOptions({
      onSuccess: (snapshot) => {
        hydrate({
          game: snapshot.game,
          rosters: snapshot.rosters,
          playerStats: snapshot.playerStats,
          teamPeriodStats: snapshot.teamPeriodStats,
          events: snapshot.events,
        });
        setOpen(false);
      },
    }),
  );

  useEffect(() => {
    if (!clock || !game) {
      return;
    }

    setQuarterMinutes(Math.floor(clock.quarterDurationSeconds / 60));
    setOvertimeMinutes(
      Math.floor(
        (clock.overtimeDurationSeconds ?? DEFAULT_OVERTIME_DURATION_SECONDS) /
          60,
      ),
    );
    setTimeoutsPerQuarter(
      game.timeoutsPerQuarter ?? DEFAULT_TIMEOUTS_PER_QUARTER,
    );
    setFoulsBeforeBonus(game.foulsBeforeBonus ?? DEFAULT_FOULS_BEFORE_BONUS);
  }, [
    clock?.quarterDurationSeconds,
    clock?.overtimeDurationSeconds,
    game?.timeoutsPerQuarter,
    game?.foulsBeforeBonus,
    clock,
    game,
  ]);

  const canEdit =
    clock != null &&
    game != null &&
    isActiveGameStatus(status) &&
    !isBusy &&
    !updateRulesMutation.isPending &&
    canEditClockConfigs(currentPeriod, clock);

  useEffect(() => {
    if (!canEdit && open) {
      setOpen(false);
    }
  }, [canEdit, open]);

  if (!clock || !game) {
    return null;
  }

  const isSaving = updateRulesMutation.isPending;

  function saveSettings() {
    if (!canEdit) {
      return;
    }

    const minutes = quarterMinutes;
    const otMinutes = overtimeMinutes;
    const timeouts = timeoutsPerQuarter;
    const fouls = foulsBeforeBonus;

    if (!Number.isFinite(minutes) || minutes <= 0) {
      return;
    }
    if (!Number.isFinite(otMinutes) || otMinutes <= 0) {
      return;
    }
    if (!Number.isFinite(timeouts) || timeouts < 0) {
      return;
    }
    if (!Number.isFinite(fouls) || fouls < 1) {
      return;
    }

    updateRulesMutation.mutate({
      gameId,
      quarterDurationSeconds: minutes * 60,
      overtimeDurationSeconds: otMinutes * 60,
      timeoutsPerQuarter: timeouts,
      foulsBeforeBonus: fouls,
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen && !canEdit) {
      return;
    }

    setOpen(nextOpen);
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button
          className="w-full gap-2"
          disabled={!canEdit}
          type="button"
          variant="outline"
        >
          <Settings className="size-4" />
          Game settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Game settings</DialogTitle>
          <DialogDescription>
            {canEdit
              ? "Quarter hasn't started yet and clocks are stopped. Save to apply."
              : clock.periodStarted
                ? "Settings are locked once a quarter has started."
                : "Settings can only be changed at the start of a quarter with clocks stopped."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`quarter-duration-${gameId}`}>
                Quarter length (minutes)
              </Label>
              <Input
                className="h-11 text-base"
                disabled={!canEdit}
                id={`quarter-duration-${gameId}`}
                min={1}
                onChange={(event) =>
                  setQuarterMinutes(Number(event.target.value))
                }
                type="number"
                value={quarterMinutes}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`overtime-duration-${gameId}`}>
                Overtime length (minutes)
              </Label>
              <Input
                className="h-11 text-base"
                disabled={!canEdit}
                id={`overtime-duration-${gameId}`}
                min={1}
                onChange={(event) =>
                  setOvertimeMinutes(Number(event.target.value))
                }
                type="number"
                value={overtimeMinutes}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`timeouts-per-quarter-${gameId}`}>
                Timeouts per quarter
              </Label>
              <Input
                className="h-11 text-base"
                disabled={!canEdit}
                id={`timeouts-per-quarter-${gameId}`}
                min={0}
                onChange={(event) =>
                  setTimeoutsPerQuarter(Number(event.target.value))
                }
                type="number"
                value={timeoutsPerQuarter}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`fouls-before-bonus-${gameId}`}>
                Team fouls for bonus
              </Label>
              <Input
                className="h-11 text-base"
                disabled={!canEdit}
                id={`fouls-before-bonus-${gameId}`}
                min={1}
                onChange={(event) =>
                  setFoulsBeforeBonus(Number(event.target.value))
                }
                type="number"
                value={foulsBeforeBonus}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full sm:w-auto"
            disabled={!canEdit || isSaving}
            onClick={saveSettings}
            type="button"
          >
            {isSaving ? "Saving..." : "Save settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
