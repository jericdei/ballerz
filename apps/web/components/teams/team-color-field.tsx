"use client";

import { TEAM_COLOR_PRESETS } from "@repo/api/constants";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeHexColor } from "@/lib/team-colors";
import { cn } from "@/lib/utils";

type TeamColorFieldProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
};

export function TeamColorField({ value, onChange, id }: TeamColorFieldProps) {
  const normalized = normalizeHexColor(value);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label
          className="relative flex size-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border shadow-sm"
          htmlFor={id ? `${id}-picker` : undefined}
        >
          <span
            className="absolute inset-0"
            style={{ backgroundColor: normalized }}
          />
          <input
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            id={id ? `${id}-picker` : undefined}
            onChange={(event) => onChange(event.target.value.toLowerCase())}
            type="color"
            value={normalized}
          />
        </label>
        <div className="flex-1">
          <Label className="sr-only" htmlFor={id}>
            Team color
          </Label>
          <Input
            className="font-mono text-sm"
            id={id}
            maxLength={7}
            onChange={(event) => onChange(event.target.value)}
            placeholder="#2563eb"
            value={value}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {TEAM_COLOR_PRESETS.map((preset) => (
          <button
            aria-label={`Use color ${preset}`}
            className={cn(
              "size-7 rounded-full border-2 transition-transform hover:scale-110",
              normalized === preset
                ? "border-foreground ring-2 ring-ring ring-offset-2"
                : "border-transparent",
            )}
            key={preset}
            onClick={() => onChange(preset)}
            style={{ backgroundColor: preset }}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
