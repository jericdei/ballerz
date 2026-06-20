"use client";

import { signOut } from "next-auth/react";

import { ModeToggle } from "@/components/mode-toggle";
import { SiteBrand } from "@/components/site-brand";
import { TransitionLink } from "@/components/transition-link";
import { Button } from "@/components/ui/button";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type AppShellProps = {
  title: string;
  titleAddon?: React.ReactNode;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  layout?: "default" | "wide" | "full";
  children: React.ReactNode;
};

export function AppShell({
  title,
  titleAddon,
  description,
  breadcrumbs = [],
  actions,
  layout = "default",
  children,
}: AppShellProps) {
  return (
    <div
      className={
        layout === "full"
          ? "flex h-svh w-full flex-col overflow-hidden"
          : layout === "wide"
            ? "flex min-h-screen w-full flex-col"
            : "mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-8"
      }
    >
      <header
        className={
          layout === "full" || layout === "wide"
            ? "flex shrink-0 items-start justify-between gap-4 border-b bg-card/50 px-4 py-3 backdrop-blur-sm md:px-6"
            : "flex items-start justify-between gap-4"
        }
      >
        <div className="min-w-0 flex-1 space-y-2">
          <SiteBrand />
          {breadcrumbs.length > 0 ? (
            <nav className="text-sm text-muted-foreground">
              {breadcrumbs.map((item, index) => (
                <span key={`${item.label}-${index}`}>
                  {item.href ? (
                    <TransitionLink
                      className="hover:text-foreground hover:underline"
                      href={item.href}
                    >
                      {item.label}
                    </TransitionLink>
                  ) : (
                    <span className="text-foreground">{item.label}</span>
                  )}
                  {index < breadcrumbs.length - 1 ? (
                    <span className="mx-2">/</span>
                  ) : null}
                </span>
              ))}
            </nav>
          ) : null}
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1
                className={
                  layout === "full" || layout === "wide"
                    ? "text-xl font-semibold tracking-tight md:text-2xl"
                    : "text-3xl font-semibold tracking-tight"
                }
              >
                {title}
              </h1>
              {titleAddon}
            </div>
            {description ? (
              <p className="text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <ModeToggle />
          <Button
            onClick={() => signOut({ redirectTo: "/login" })}
            type="button"
            variant="outline"
          >
            Sign out
          </Button>
        </div>
      </header>
      <main
        className={
          layout === "full"
            ? "flex min-h-0 flex-1 flex-col overflow-hidden"
            : layout === "wide"
              ? "mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 md:px-6"
              : undefined
        }
      >
        {children}
      </main>
    </div>
  );
}
