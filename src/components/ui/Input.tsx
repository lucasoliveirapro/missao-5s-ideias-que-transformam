import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";

export function Field({
  label,
  children,
  className = ""
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid gap-1.5 text-sm font-medium text-slate-700 ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 ${props.className ?? ""}`}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 ${props.className ?? ""}`}
    />
  );
}

export function Checkbox({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
      <input
        {...props}
        className="size-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}
