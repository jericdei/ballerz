import Link from "next/link";

import { BallerzLogo } from "@/components/ballerz-logo";
import { cn } from "@/lib/utils";

type SiteBrandProps = {
  className?: string;
  showWordmark?: boolean;
};

export function SiteBrand({ className, showWordmark = true }: SiteBrandProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center gap-2 rounded-md text-foreground transition-opacity hover:opacity-80",
        className,
      )}
      href="/leagues"
    >
      <BallerzLogo size={28} />
      {showWordmark ? (
        <span className="text-base font-semibold tracking-tight">Ballerz</span>
      ) : null}
    </Link>
  );
}
