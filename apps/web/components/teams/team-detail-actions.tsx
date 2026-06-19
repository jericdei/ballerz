"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { CreatePlayerDialog } from "@/components/players/create-player-dialog";
import { DeleteTeamDialog } from "@/components/teams/delete-team-dialog";
import { EditTeamDialog } from "@/components/teams/edit-team-dialog";
import { Button } from "@/components/ui/button";

type TeamDetailActionsProps = {
  teamId: number;
  leagueId: number;
  teamName: string;
  playerCount: number;
  maxPlayers: number;
};

export function TeamDetailActions({
  teamId,
  leagueId,
  teamName,
  playerCount,
  maxPlayers,
}: TeamDetailActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <CreatePlayerDialog
        maxPlayers={maxPlayers}
        playerCount={playerCount}
        teamId={teamId}
      />
      <Button onClick={() => setEditOpen(true)} type="button" variant="outline">
        Edit
      </Button>
      <Button
        onClick={() => setDeleteOpen(true)}
        type="button"
        variant="outline"
      >
        Delete
      </Button>
      <EditTeamDialog
        defaultName={teamName}
        leagueId={leagueId}
        onOpenChange={setEditOpen}
        open={editOpen}
        teamId={teamId}
      />
      <DeleteTeamDialog
        leagueId={leagueId}
        onDeleted={() => router.push(`/leagues/${leagueId}`)}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        teamId={teamId}
        teamName={teamName}
      />
    </>
  );
}
