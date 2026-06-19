"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { DeleteTeamDialog } from "@/components/teams/delete-team-dialog";
import { EditTeamDialog } from "@/components/teams/edit-team-dialog";
import type { TeamRow } from "@/components/teams/teams-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TeamRowActionsProps = {
  team: TeamRow;
  leagueId: number;
  onDeleted?: () => void;
};

export function TeamRowActions({
  team,
  leagueId,
  onDeleted,
}: TeamRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="size-8"
            onClick={(event) => event.stopPropagation()}
            size="icon"
            type="button"
            variant="ghost"
          >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation();
              setEditOpen(true);
            }}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(event) => {
              event.stopPropagation();
              setDeleteOpen(true);
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditTeamDialog
        defaultName={team.name ?? ""}
        leagueId={leagueId}
        onOpenChange={setEditOpen}
        open={editOpen}
        teamId={team.id}
      />
      <DeleteTeamDialog
        leagueId={leagueId}
        onDeleted={onDeleted}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        teamId={team.id}
        teamName={team.name ?? "Untitled team"}
      />
    </>
  );
}
