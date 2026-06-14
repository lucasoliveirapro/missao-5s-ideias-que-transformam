export function PodiumMetric({
  label,
  value,
  emphasized = false
}: {
  label: string;
  value: string | number;
  emphasized?: boolean;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 font-bold ${emphasized ? "text-2xl text-emerald-700" : "text-lg text-slate-950"}`}>
        {value}
      </p>
    </div>
  );
}
