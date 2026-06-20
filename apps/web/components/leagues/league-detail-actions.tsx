"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { DeleteLeagueDialog } from "@/components/leagues/delete-league-dialog";
import { EditLeagueDialog } from "@/components/leagues/edit-league-dialog";
import { Button } from "@/components/ui/button";
import { useTransitionRouter } from "@/hooks/use-transition-router";

type LeagueDetailActionsProps = {
  leagueId: number;
  leagueName: string;
};

export function LeagueDetailActions({
  leagueId,
  leagueName,
}: LeagueDetailActionsProps) {
  const router = useTransitionRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
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
