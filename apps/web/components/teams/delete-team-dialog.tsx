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

type DeleteTeamDialogProps = {
  teamId: number;
  leagueId: number;
  teamName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function DeleteTeamDialog({
  teamId,
  leagueId,
  teamName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteTeamDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    trpc.teams.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.teams.listByLeague.queryFilter({ leagueId }),
        );
        await queryClient.invalidateQueries(
          trpc.leagues.getById.queryFilter({ id: leagueId }),
        );
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
          <AlertDialogTitle>Delete team?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove{" "}
            <span className="font-medium text-foreground">
              {teamName || "this team"}
            </span>{" "}
            and all players on its roster.
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
              deleteMutation.mutate({ id: teamId });
            }}
            variant="destructive"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete team"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
