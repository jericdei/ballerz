"use client";

import { useMutation } from "@tanstack/react-query";

import {
  DEFAULT_FOULS_BEFORE_BONUS,
  DEFAULT_TIMEOUTS_PER_QUARTER,
} from "@repo/shared";

import { useStatsheetMutations } from "@/components/statsheet/statsheet-mutations-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isActiveGameStatus } from "@/lib/statsheet-utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";
import { useTRPC } from "@/trpc/client";

type StatsheetGameRulesProps = {
  gameId: number;
  compact?: boolean;
};

export function StatsheetGameRules({
  gameId,
  compact = false,
}: StatsheetGameRulesProps) {
  const trpc = useTRPC();
  const game = useStatsheetStore((state) => state.game);
  const status = useStatsheetStore((state) => state.status);
  const hydrate = useStatsheetStore((state) => state.hydrate);
  const { isBusy } = useStatsheetMutations();

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
      },
    }),
  );

  if (!game) {
    return null;
  }

  const canEdit =
    isActiveGameStatus(status) && !isBusy && !updateRulesMutation.isPending;

  function saveTimeouts(value: number) {
    if (!Number.isFinite(value) || value < 0) return;
    updateRulesMutation.mutate({
      gameId,
      timeoutsPerQuarter: value,
    });
  }

  function saveFoulsBeforeBonus(value: number) {
    if (!Number.isFinite(value) || value < 1) return;
    updateRulesMutation.mutate({
      gameId,
      foulsBeforeBonus: value,
    });
  }

  return (
    <div
      className={
        compact
          ? "grid gap-3 sm:grid-cols-2"
          : "mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2"
      }
    >
      <div className="space-y-2">
        <Label htmlFor={`timeouts-per-quarter-${gameId}`}>
          Timeouts per quarter
        </Label>
        <Input
          defaultValue={game.timeoutsPerQuarter ?? DEFAULT_TIMEOUTS_PER_QUARTER}
          disabled={!canEdit}
          id={`timeouts-per-quarter-${gameId}`}
          min={0}
          onBlur={(event) => saveTimeouts(Number(event.target.value))}
          type="number"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`fouls-before-bonus-${gameId}`}>
          Team fouls for bonus
        </Label>
        <Input
          defaultValue={game.foulsBeforeBonus ?? DEFAULT_FOULS_BEFORE_BONUS}
          disabled={!canEdit}
          id={`fouls-before-bonus-${gameId}`}
          min={1}
          onBlur={(event) => saveFoulsBeforeBonus(Number(event.target.value))}
          type="number"
        />
      </div>
    </div>
  );
}
