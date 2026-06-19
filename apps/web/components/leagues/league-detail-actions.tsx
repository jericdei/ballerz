"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { DeleteLeagueDialog } from "@/components/leagues/delete-league-dialog";
import { EditLeagueDialog } from "@/components/leagues/edit-league-dialog";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { Button } from "@/components/ui/button";

type LeagueDetailActionsProps = {
  leagueId: number;
  leagueName: string;
};

export function LeagueDetailActions({
  leagueId,
  leagueName,
}: LeagueDetailActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <CreateTeamDialog leagueId={leagueId} />
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
      <EditLeagueDialog
        defaultName={leagueName}
        leagueId={leagueId}
        onOpenChange={setEditOpen}
        open={editOpen}
      />
      <DeleteLeagueDialog
        leagueId={leagueId}
        leagueName={leagueName}
        onDeleted={() => router.push("/leagues")}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
      />
    </>
  );
}
