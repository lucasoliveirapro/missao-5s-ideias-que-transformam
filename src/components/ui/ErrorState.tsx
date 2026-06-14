import { TriangleAlert } from "lucide-react";

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
