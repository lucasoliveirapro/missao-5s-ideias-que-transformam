import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { OperatorForm } from "@/components/operators/OperatorForm";
import { OperatorsTable } from "@/components/operators/OperatorsTable";
import { requireRole } from "@/lib/supabase/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CondutoresPage() {
  await requireRole(["admin", "leader"]);
  const supabase = await createServerSupabaseClient();
  const { data: operatorsData } = await supabase
    .from("operators")
    .select("*, operator_aliases(alias)")
    .order("name", { ascending: true });
  const operators = operatorsData ?? [];

  return (
    <AppShell>
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Condutores</h1>
          <p className="mt-1 text-sm text-slate-600">
            Cadastre matricula, turno, equipe, UTE, aliases e foto privada para cruzar com a base SS.
          </p>
        </div>
        <OperatorForm />
        <Card>
          <CardHeader title="Condutores cadastrados" />
          {operators.length > 0 ? (
            <OperatorsTable operators={operators} />
          ) : (
            <EmptyState title="Nenhum condutor cadastrado" description="Crie o primeiro cadastro manual." />
          )}
        </Card>
      </div>
    </AppShell>
  );
}
