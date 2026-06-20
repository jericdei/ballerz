"use client";

import { Megaphone } from "lucide-react";

import { useStatsheetMutations } from "@/components/statsheet/statsheet-mutations-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StatsheetBuzzerButtonProps = {
  className?: string;
  label?: string;
  layout?: "default" | "tablet";
  showIcon?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary";
};

export function StatsheetBuzzerButton({
  className,
  label = "Buzzer",
  layout = "default",
  showIcon = true,
  size = "sm",
  variant = "outline",
}: StatsheetBuzzerButtonProps) {
  const { isBusy, startBuzzer, stopBuzzer } = useStatsheetMutations();

  const pointerHandlers = {
    onPointerCancel: stopBuzzer,
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      startBuzzer();
    },
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      stopBuzzer();
    },
  };

  if (layout === "tablet") {
    return (
      <button
        className={cn(
          "group flex min-h-18 w-full touch-none select-none flex-col items-center justify-center gap-1 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 text-center transition-colors md:min-h-20 md:gap-1.5 md:p-4",
          "hover:border-violet-500/50 hover:bg-violet-500/20",
          "disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
        disabled={isBusy}
        title="Hold to sound the buzzer"
        type="button"
        {...pointerHandlers}
      >
        {showIcon ? (
          <Megaphone className="size-7 text-violet-600 dark:text-violet-400" />
        ) : null}
        <span className="text-base font-bold leading-tight">{label}</span>
        <span className="text-xs font-medium text-muted-foreground">
          Hold to sound
        </span>
      </button>
    );
  }

  return (
    <Button
      className={cn("touch-none select-none", className)}
      disabled={isBusy}
      size={size}
      title="Hold to sound the buzzer"
      type="button"
      variant={variant}
      {...pointerHandlers}
    >
      {showIcon ? <Megaphone className="size-3.5" /> : null}
      {label}
    </Button>
  );
}
