"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { GameRow } from "@/components/games/games-table";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

type StartGameButtonProps = {
  game: GameRow;
  leagueId: number;
};

export function StartGameButton({ game, leagueId }: StartGameButtonProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const startMutation = useMutation(
    trpc.games.start.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.games.listByLeague.queryFilter({ leagueId }),
        );
        router.push(`/leagues/${leagueId}/games/${game.id}`);
      },
    }),
  );

  if (game.status !== "scheduled" && game.status !== "cancelled") {
    return null;
  }

  return (
    <Button
      disabled={startMutation.isPending}
      onClick={(event) => {
        event.stopPropagation();
        startMutation.mutate({ id: game.id });
      }}
      size="sm"
      type="button"
      variant="outline"
    >
      {startMutation.isPending ? "Starting..." : "Start"}
    </Button>
  );
}
