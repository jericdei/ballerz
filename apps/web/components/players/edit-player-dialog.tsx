"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import type { PlayerRow } from "@/components/players/players-table";
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
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  number: z.coerce.number().int().min(0).max(99),
  position: z.string().trim().optional(),
  isCaptain: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type EditPlayerDialogProps = {
  player: PlayerRow;
  teamId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditPlayerDialog({
  player,
  teamId,
  open,
  onOpenChange,
}: EditPlayerDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: player.firstName,
      lastName: player.lastName,
      number: player.number,
      position: player.position ?? "",
      isCaptain: player.isCaptain,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        firstName: player.firstName,
        lastName: player.lastName,
        number: player.number,
        position: player.position ?? "",
        isCaptain: player.isCaptain,
      });
    }
  }, [open, player, form]);

  const updateMutation = useMutation(
    trpc.players.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.players.listByTeam.queryFilter({ teamId }),
        );
        onOpenChange(false);
      },
    }),
  );

  function onSubmit(values: FormValues) {
    updateMutation.mutate({
      id: player.id,
      firstName: values.firstName,
      lastName: values.lastName,
      number: values.number,
      position: values.position || undefined,
      isCaptain: values.isCaptain,
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
          <DialogTitle>Edit player</DialogTitle>
          <DialogDescription>Update player details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jersey #</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input placeholder="PG" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isCaptain"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <input
                      checked={field.value}
                      className="size-4 rounded border"
                      onChange={(event) => field.onChange(event.target.checked)}
                      type="checkbox"
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Team captain</FormLabel>
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
