"use client";

import type { ComponentProps } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import { viewTransitionNavigate } from "@/lib/view-transition";

type TransitionLinkProps = ComponentProps<typeof NextLink>;

function shouldHandleTransition(event: React.MouseEvent<HTMLAnchorElement>) {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }

  return true;
}

export function TransitionLink({
  href,
  onClick,
  replace,
  scroll,
  target,
  ...props
}: TransitionLinkProps) {
  const router = useRouter();

  return (
    <NextLink
      href={href}
      onClick={(event) => {
        onClick?.(event);

        if (!shouldHandleTransition(event)) return;
        if (target === "_blank") return;

        event.preventDefault();

        const url = new URL(event.currentTarget.href);
        const path = `${url.pathname}${url.search}${url.hash}`;

        viewTransitionNavigate(() => {
          if (replace) {
            router.replace(path, { scroll });
            return;
          }

          router.push(path, { scroll });
        });
      }}
      replace={replace}
      scroll={scroll}
      target={target}
      {...props}
    />
  );
}
