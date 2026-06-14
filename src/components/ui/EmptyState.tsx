import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <Inbox className="mb-3 size-10 text-slate-400" aria-hidden="true" />
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-600">{description}</p>
    </div>
  );
}
