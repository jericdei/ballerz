"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { teamColorSchema } from "@repo/api/constants";

import { TeamColorField } from "@/components/teams/team-color-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

type EditTeamDialogProps = {
  teamId: number;
  leagueId: number;
  defaultName: string;
  defaultColor: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditTeamDialog({
  teamId,
  leagueId,
  defaultName,
  defaultColor,
  open,
  onOpenChange,
}: EditTeamDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: defaultName, color: defaultColor },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: defaultName, color: defaultColor });
    }
  }, [open, defaultName, defaultColor, form]);

  const updateMutation = useMutation(
    trpc.teams.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.teams.listByLeague.queryFilter({ leagueId }),
        );
        await queryClient.invalidateQueries(
          trpc.leagues.getById.queryFilter({ id: leagueId }),
        );
        await queryClient.invalidateQueries(trpc.leagues.list.queryFilter());
        onOpenChange(false);
      },
    }),
  );

  function onSubmit(values: FormValues) {
    updateMutation.mutate({
      id: teamId,
      name: values.name,
      color: values.color,
    });
  }

  return (
    <Dialog
      onOpenChange={guardDialogOpenChange(
        updateMutation.isPending,
        onOpenChange,
      )}
      open={open}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit team</DialogTitle>
          <DialogDescription>Update the team name and color.</DialogDescription>
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
                    <Input {...field} />
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
                      id="edit-team-color"
                      onChange={field.onChange}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {updateMutation.error ? (
              <p className="text-sm text-destructive">
                {updateMutation.error.message}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                disabled={updateMutation.isPending}
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={updateMutation.isPending} type="submit">
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
