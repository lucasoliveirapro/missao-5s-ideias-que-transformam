"use client";

import { useState, useTransition } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { ImportSummary } from "./ImportSummary";

type ImportResult = Parameters<typeof ImportSummary>[0]["files"];

export function UploadSsFile() {
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ImportResult>([]);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/import/ss", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error || "Falha ao importar arquivo.");
        return;
      }

      setResults(payload.files ?? []);
      event.currentTarget.reset();
    });
  }

  return (
    <div className="grid gap-5">
      <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={onSubmit}>
        {error ? <ErrorState message={error} /> : null}
        <label className="grid cursor-pointer place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-emerald-600 hover:bg-emerald-50">
          <UploadCloud className="mb-3 size-10 text-emerald-700" aria-hidden="true" />
          <span className="font-semibold text-slate-950">Selecionar arquivo SS do Manusis4</span>
          <span className="mt-1 text-sm text-slate-600">Apenas .xlsx, ate 15 MB por arquivo</span>
          <input accept=".xlsx" className="sr-only" multiple name="files" required type="file" />
        </label>
        <Button disabled={isPending} type="submit">
          {isPending ? "Importando" : "Importar base SS"}
        </Button>
      </form>
      <ImportSummary files={results} />
    </div>
  );
}
