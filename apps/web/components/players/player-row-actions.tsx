"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { DeletePlayerDialog } from "@/components/players/delete-player-dialog";
import { EditPlayerDialog } from "@/components/players/edit-player-dialog";
import type { PlayerRow } from "@/components/players/players-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PlayerRowActionsProps = {
  player: PlayerRow;
  teamId: number;
};

export function PlayerRowActions({ player, teamId }: PlayerRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const playerName = `${player.firstName} ${player.lastName}`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="size-8" size="icon" type="button" variant="ghost">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditPlayerDialog
        onOpenChange={setEditOpen}
        open={editOpen}
        player={player}
        teamId={teamId}
      />
      <DeletePlayerDialog
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        playerId={player.id}
        playerName={playerName}
        teamId={teamId}
      />
    </>
  );
}
