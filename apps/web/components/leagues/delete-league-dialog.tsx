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
import { useTRPC } from "@/trpc/client";

type DeleteLeagueDialogProps = {
  leagueId: number;
  leagueName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function DeleteLeagueDialog({
  leagueId,
  leagueName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteLeagueDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    trpc.leagues.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.leagues.list.queryFilter());
        onOpenChange(false);
        onDeleted?.();
      },
    }),
  );

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete league?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove{" "}
            <span className="font-medium text-foreground">
              {leagueName || "this league"}
            </span>{" "}
            and all of its teams and players.
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
              deleteMutation.mutate({ id: leagueId });
            }}
            variant="destructive"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete league"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
