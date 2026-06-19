"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

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
      <Button
        className="gap-1.5"
        onClick={() => setEditOpen(true)}
        size="sm"
        type="button"
        variant="outline"
      >
        <Pencil className="size-3.5" />
        Edit
      </Button>
      <Button
        className="gap-1.5"
        onClick={() => setDeleteOpen(true)}
        size="sm"
        type="button"
        variant="outline"
      >
        <Trash2 className="size-3.5" />
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
