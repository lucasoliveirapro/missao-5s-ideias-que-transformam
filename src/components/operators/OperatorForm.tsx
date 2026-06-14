"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Checkbox, Field, Input, Select } from "@/components/ui/Input";

export function OperatorForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    const body = {
      name: String(formData.get("name") || ""),
      badge: String(formData.get("badge") || ""),
      shift: String(formData.get("shift") || ""),
      team: String(formData.get("team") || ""),
      ute: String(formData.get("ute") || ""),
      active: formData.get("active") === "on",
      aliases: String(formData.get("aliases") || "")
        .split(",")
        .map((alias) => alias.trim())
        .filter(Boolean)
    };

    startTransition(async () => {
      const response = await fetch("/api/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error || "Falha ao cadastrar condutor.");
        return;
      }

      event.currentTarget.reset();
      router.refresh();
    });
  }

  return (
    <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={onSubmit}>
      {error ? <ErrorState message={error} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome completo">
          <Input name="name" required />
        </Field>
        <Field label="Matricula">
          <Input name="badge" />
        </Field>
        <Field label="Turno">
          <Input name="shift" placeholder="1o turno" />
        </Field>
        <Field label="Equipe">
          <Input name="team" placeholder="Equipe A" />
        </Field>
        <Field label="UTE">
          <Select name="ute">
            <option value="">Nao informado</option>
            <option value="UTE_1A">UTE_1A</option>
            <option value="UTE_1B">UTE_1B</option>
            <option value="UTE_2">UTE_2</option>
            <option value="UTE_3">UTE_3</option>
          </Select>
        </Field>
        <Field label="Aliases">
          <Input name="aliases" placeholder="Nome no Manusis, Apelido" />
        </Field>
      </div>
      <Checkbox defaultChecked label="Ativo" name="active" />
      <Button disabled={isPending} type="submit">
        <Save className="size-4" aria-hidden="true" />
        {isPending ? "Salvando" : "Cadastrar condutor"}
      </Button>
    </form>
  );
}
