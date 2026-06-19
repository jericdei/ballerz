"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

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
  name: z.string().trim().min(1, "League name is required"),
});

type FormValues = z.infer<typeof formSchema>;

type EditLeagueDialogProps = {
  leagueId: number;
  defaultName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditLeagueDialog({
  leagueId,
  defaultName,
  open,
  onOpenChange,
}: EditLeagueDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: defaultName },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: defaultName });
    }
  }, [open, defaultName, form]);

  const updateMutation = useMutation(
    trpc.leagues.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.leagues.list.queryFilter());
        await queryClient.invalidateQueries(
          trpc.leagues.getById.queryFilter({ id: leagueId }),
        );
        onOpenChange(false);
      },
    }),
  );

  function onSubmit(values: FormValues) {
    updateMutation.mutate({ id: leagueId, name: values.name });
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
          <DialogTitle>Edit league</DialogTitle>
          <DialogDescription>Update the league name.</DialogDescription>
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
