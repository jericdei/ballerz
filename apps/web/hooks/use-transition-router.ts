"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { viewTransitionNavigate } from "@/lib/view-transition";

type NavigateOptions = Parameters<ReturnType<typeof useRouter>["push"]>[1];

export function useTransitionRouter() {
  const router = useRouter();

  return useMemo(
    () => ({
      ...router,
      push: (href: string, options?: NavigateOptions) =>
        viewTransitionNavigate(() => router.push(href, options)),
      replace: (href: string, options?: NavigateOptions) =>
        viewTransitionNavigate(() => router.replace(href, options)),
      back: () => viewTransitionNavigate(() => router.back()),
      forward: () => viewTransitionNavigate(() => router.forward()),
    }),
    [router],
  );
}
