import { LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Carregando" }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-slate-600">
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}
