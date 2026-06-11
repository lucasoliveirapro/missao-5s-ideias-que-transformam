import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";

export function CardsFilters({
  defaults
}: {
  defaults: { startDate: string; endDate: string };
}) {
  return (
    <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-5" method="get">
      <Field label="Data inicial">
        <Input defaultValue={defaults.startDate} name="startDate" type="date" />
      </Field>
      <Field label="Data final">
        <Input defaultValue={defaults.endDate} name="endDate" type="date" />
      </Field>
      <Field label="Usuario">
        <Input name="user" placeholder="Condutor" />
      </Field>
      <Field label="Tipo Z">
        <Select name="zType">
          <option value="">Todos</option>
          <option value="Z2">Z2</option>
          <option value="Z3">Z3</option>
          <option value="Z4">Z4</option>
        </Select>
      </Field>
      <div className="self-end">
        <Button className="w-full" type="submit">
          Filtrar
        </Button>
      </div>
    </form>
  );
}
