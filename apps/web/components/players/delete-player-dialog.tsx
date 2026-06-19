"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

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

type DeletePlayerDialogProps = {
  playerId: number;
  teamId: number;
  playerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeletePlayerDialog({
  playerId,
  teamId,
  playerName,
  open,
  onOpenChange,
}: DeletePlayerDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    trpc.players.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.players.listByTeam.queryFilter({ teamId }),
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
          <AlertDialogTitle>Delete player?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove{" "}
            <span className="font-medium text-foreground">
              {playerName || "this player"}
            </span>{" "}
            from the roster.
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
              deleteMutation.mutate({ id: playerId });
            }}
            variant="destructive"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete player"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
