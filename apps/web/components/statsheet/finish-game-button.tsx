"use client";

import { useEffect, useState } from "react";
import { Flag } from "lucide-react";

import { formatMatchup } from "@/components/games/game-labels";
import { useStatsheetMutations } from "@/components/statsheet/statsheet-mutations-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { guardDialogOpenChange } from "@/lib/dialog-open-change";
import { isActiveGameStatus } from "@/lib/statsheet-utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";

export function FinishGameButton() {
  const game = useStatsheetStore((state) => state.game);
  const status = useStatsheetStore((state) => state.status);
  const { isBusy, isFinishing, finishGame, error } = useStatsheetMutations();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (status === "final") {
      setOpen(false);
    }
  }, [status]);

  if (!game || !isActiveGameStatus(status)) {
    return null;
  }

  const matchup = formatMatchup(game.firstTeamName, game.secondTeamName);

  return (
    <AlertDialog
      onOpenChange={guardDialogOpenChange(isFinishing, setOpen)}
      open={open}
    >
      <AlertDialogTrigger asChild>
        <Button
          className="gap-1.5"
          disabled={isBusy}
          size="sm"
          type="button"
          variant="outline"
        >
          <Flag className="size-3.5" />
          Finish game
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Finish this game?</AlertDialogTitle>
          <AlertDialogDescription>
            {matchup} will be marked final. Stats will be locked and counted
            toward league leaders. Any unsaved stats will be saved first.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && !isFinishing ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isFinishing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isFinishing}
            onClick={(event) => {
              event.preventDefault();
              finishGame();
            }}
          >
            {isFinishing ? "Finishing..." : "Finish game"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
