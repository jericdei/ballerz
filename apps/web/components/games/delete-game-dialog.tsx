"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { formatMatchup } from "@/components/games/game-labels";
import type { GameRow } from "@/components/games/games-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { guardDialogOpenChange } from "@/lib/dialog-open-change";
import { useTRPC } from "@/trpc/client";

type DeleteGameDialogProps = {
  game: GameRow;
  leagueId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteGameDialog({
  game,
  leagueId,
  open,
  onOpenChange,
}: DeleteGameDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    trpc.games.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.games.listByLeague.queryFilter({ leagueId }),
        );
        onOpenChange(false);
      },
    }),
  );

  return (
    <AlertDialog
      onOpenChange={guardDialogOpenChange(
        deleteMutation.isPending,
        onOpenChange,
      )}
      open={open}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete game?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove{" "}
            <span className="font-medium text-foreground">
              {formatMatchup(game.firstTeamName, game.secondTeamName)}
            </span>{" "}
            from the schedule.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deleteMutation.error ? (
          <p className="text-sm text-destructive">
            {deleteMutation.error.message}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              deleteMutation.mutate({ id: game.id });
            }}
            variant="destructive"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete game"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
