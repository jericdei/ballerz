"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type AppShellProps = {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({
  title,
  description,
  breadcrumbs = [],
  actions,
  children,
}: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          {breadcrumbs.length > 0 ? (
            <nav className="text-sm text-muted-foreground">
              {breadcrumbs.map((item, index) => (
                <span key={`${item.label}-${index}`}>
                  {item.href ? (
                    <Link
                      className="hover:text-foreground hover:underline"
                      href={item.href}
                    >
                      {item.label}
                    </Link>
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
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
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
      {children}
    </div>
  );
}
