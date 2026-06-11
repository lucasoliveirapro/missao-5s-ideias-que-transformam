"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select } from "@/components/ui/Input";

export function TopThreeFilters({
  defaults
}: {
  defaults: { startDate: string; endDate: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      if (value === "on") {
        params.set(key, "true");
      } else if (String(value).trim()) {
        params.set(key, String(value));
      }
    }

    router.push(`/ranking/top3?${params.toString()}`);
  }

  const get = (key: string, fallback = "") => searchParams.get(key) ?? fallback;

  return (
    <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Data inicial">
          <Input defaultValue={get("startDate", defaults.startDate)} name="startDate" type="date" />
        </Field>
        <Field label="Data final">
          <Input defaultValue={get("endDate", defaults.endDate)} name="endDate" type="date" />
        </Field>
        <Field label="Turno">
          <Input defaultValue={get("shift")} name="shift" placeholder="1o turno" />
        </Field>
        <Field label="Equipe">
          <Input defaultValue={get("team")} name="team" placeholder="Equipe A" />
        </Field>
        <Field label="UTE">
          <Select defaultValue={get("ute")} name="ute">
            <option value="">Todas</option>
            <option value="UTE_1A">UTE_1A</option>
            <option value="UTE_1B">UTE_1B</option>
            <option value="UTE_2">UTE_2</option>
            <option value="UTE_3">UTE_3</option>
            <option value="UNKNOWN">UNKNOWN</option>
          </Select>
        </Field>
        <Field label="Linha">
          <Input defaultValue={get("line")} name="line" placeholder="AUC" />
        </Field>
        <Field label="Status">
          <Input defaultValue={get("status")} name="status" placeholder="Aberta" />
        </Field>
        <Field label="Tipo">
          <Select defaultValue={get("zType", "ALL")} name="zType">
            <option value="ALL">Todos</option>
            <option value="Z2">Z2</option>
            <option value="Z3">Z3</option>
            <option value="Z4">Z4</option>
          </Select>
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Checkbox defaultChecked={get("includeCanceled") === "true"} label="Incluir canceladas" name="includeCanceled" />
        <Checkbox
          defaultChecked={get("includeIntegration") === "true"}
          label="Incluir integracao/PXBREMOTE"
          name="includeIntegration"
        />
        <Checkbox
          defaultChecked={get("registeredOnly") === "true"}
          label="Apenas condutores cadastrados"
          name="registeredOnly"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit">
          <Filter className="size-4" aria-hidden="true" />
          Filtrar
        </Button>
        <ButtonLink href="/ranking/top3" variant="ghost">
          <RotateCcw className="size-4" aria-hidden="true" />
          Limpar
        </ButtonLink>
      </div>
    </form>
  );
}
