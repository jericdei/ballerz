import { Loader2 } from "lucide-react";

type CrudPageLoadingProps = {
  message?: string;
};

export function CrudPageLoading({
  message = "Loading...",
}: CrudPageLoadingProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
