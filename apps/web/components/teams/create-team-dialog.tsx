"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { z } from "zod";

import { DEFAULT_TEAM_COLOR, teamColorSchema } from "@repo/api/constants";

import { TeamColorField } from "@/components/teams/team-color-field";
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
import { Input } from "@/components/ui/input";
import { guardDialogOpenChange } from "@/lib/dialog-open-change";
import { useTRPC } from "@/trpc/client";

const formSchema = z.object({
  name: z.string().trim().min(1, "Team name is required"),
  color: teamColorSchema,
});

type FormValues = z.infer<typeof formSchema>;

type CreateTeamDialogProps = {
  leagueId: number;
};

export function CreateTeamDialog({ leagueId }: CreateTeamDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", color: DEFAULT_TEAM_COLOR },
  });

  const createMutation = useMutation(
    trpc.teams.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.teams.listByLeague.queryFilter({ leagueId }),
        );
        await queryClient.invalidateQueries(
          trpc.leagues.getById.queryFilter({ id: leagueId }),
        );
        await queryClient.invalidateQueries(trpc.leagues.list.queryFilter());
        form.reset();
        setOpen(false);
      },
    }),
  );

  function onSubmit(values: FormValues) {
    createMutation.mutate({
      leagueId,
      name: values.name,
      color: values.color,
    });
  }

  return (
    <Dialog
      onOpenChange={guardDialogOpenChange(createMutation.isPending, setOpen)}
      open={open}
    >
      <DialogTrigger asChild>
        <Button className="gap-1.5" size="sm" type="button">
          <Plus className="size-4" />
          Add team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add team</DialogTitle>
          <DialogDescription>
            Create a team inside this league.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Warriors" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <TeamColorField
                      id="create-team-color"
                      onChange={field.onChange}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {createMutation.error ? (
              <p className="text-sm text-destructive">
                {createMutation.error.message}
              </p>
            ) : null}
            <DialogFooter>
              <Button disabled={createMutation.isPending} type="submit">
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
