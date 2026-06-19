import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type CrudAccent = "blue" | "orange" | "emerald" | "violet" | "amber";

const accentStyles: Record<
  CrudAccent,
  { border: string; header: string; icon: string }
> = {
  blue: {
    border: "border-blue-500/30",
    header: "bg-blue-500/10",
    icon: "text-blue-600 dark:text-blue-400",
  },
  orange: {
    border: "border-orange-500/30",
    header: "bg-orange-500/10",
    icon: "text-orange-600 dark:text-orange-400",
  },
  emerald: {
    border: "border-emerald-500/30",
    header: "bg-emerald-500/10",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  violet: {
    border: "border-violet-500/30",
    header: "bg-violet-500/10",
    icon: "text-violet-600 dark:text-violet-400",
  },
  amber: {
    border: "border-amber-500/30",
    header: "bg-amber-500/10",
    icon: "text-amber-600 dark:text-amber-400",
  },
};

type CrudPageSectionProps = {
  title: string;
  description?: string;
  icon: LucideIcon;
  accent?: CrudAccent;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function CrudPageSection({
  title,
  description,
  icon: Icon,
  accent = "blue",
  actions,
  children,
}: CrudPageSectionProps) {
  const styles = accentStyles[accent];

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border-2 bg-card shadow-sm",
        styles.border,
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-start justify-between gap-4 border-b px-4 py-4 md:px-6",
          styles.header,
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl bg-background/80",
              styles.icon,
            )}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </section>
  );
}
