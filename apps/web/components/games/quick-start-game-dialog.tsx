"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { z } from "zod";

import { GAME_TYPES } from "@repo/api/constants";

import { formatGameType } from "@/components/games/game-labels";
import type { TeamRow } from "@/components/teams/teams-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { guardDialogOpenChange } from "@/lib/dialog-open-change";
import { useTRPC } from "@/trpc/client";

const formSchema = z
  .object({
    firstTeamId: z.coerce.number().int().positive("Select a team"),
    secondTeamId: z.coerce.number().int().positive("Select a team"),
    type: z.enum(GAME_TYPES),
  })
  .refine((values) => values.firstTeamId !== values.secondTeamId, {
    message: "Teams must be different",
    path: ["secondTeamId"],
  });

type FormValues = z.infer<typeof formSchema>;

type QuickStartGameDialogProps = {
  leagueId: number;
  teams: TeamRow[];
  disabled?: boolean;
};

export function QuickStartGameDialog({
  leagueId,
  teams,
  disabled = false,
}: QuickStartGameDialogProps) {
  const trpc = useTRPC();
  const router = useTransitionRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstTeamId: teams[0]?.id ?? 0,
      secondTeamId: teams[1]?.id ?? 0,
      type: "regular",
    },
  });

  const quickStartMutation = useMutation(
    trpc.games.quickStart.mutationOptions({
      onSuccess: async (result) => {
        await queryClient.invalidateQueries(
          trpc.games.listByLeague.queryFilter({ leagueId }),
        );
        await queryClient.invalidateQueries(
          trpc.leagues.getById.queryFilter({ id: leagueId }),
        );
        setOpen(false);
        router.push(`/leagues/${leagueId}/games/${result.id}`);
      },
    }),
  );

  function onSubmit(values: FormValues) {
    quickStartMutation.mutate({
      leagueId,
      firstTeamId: values.firstTeamId,
      secondTeamId: values.secondTeamId,
      type: values.type,
    });
  }

  return (
    <Dialog
      onOpenChange={guardDialogOpenChange(
        quickStartMutation.isPending,
        setOpen,
      )}
      open={open}
    >
      <DialogTrigger asChild>
        <Button
          className="gap-1.5"
          disabled={disabled}
          size="sm"
          type="button"
          variant="outline"
        >
          <Zap className="size-4" />
          Quick start
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick start game</DialogTitle>
          <DialogDescription>
            Create and start a game immediately without scheduling.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="firstTeamId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First team</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={String(team.id)}>
                          {team.name ?? "Untitled team"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secondTeamId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Second team</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={String(team.id)}>
                          {team.name ?? "Untitled team"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GAME_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {formatGameType(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {quickStartMutation.error ? (
              <p className="text-sm text-destructive">
                {quickStartMutation.error.message}
              </p>
            ) : null}
            <DialogFooter>
              <Button disabled={quickStartMutation.isPending} type="submit">
                {quickStartMutation.isPending ? "Starting..." : "Start game"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
