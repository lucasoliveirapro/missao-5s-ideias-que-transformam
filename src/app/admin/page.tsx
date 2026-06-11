import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { formatBrDate } from "@/lib/date";
import { requireRole } from "@/lib/supabase/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireRole(["admin"]);
  const supabase = await createServerSupabaseClient();
  const [{ data: batchesData }, { data: logsData }, { data: profilesData }] = await Promise.all([
    supabase.from("import_batches").select("*").order("created_at", { ascending: false }).limit(10),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(10),
    supabase.from("user_profiles").select("*").order("created_at", { ascending: false }).limit(20)
  ]);
  const batches = batchesData ?? [];
  const logs = logsData ?? [];
  const profiles = profilesData ?? [];

  return (
    <AppShell>
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Admin</h1>
          <p className="mt-1 text-sm text-slate-600">Auditoria, lotes e perfis de usuario.</p>
        </div>
        <Card>
          <CardHeader title="Perfis" description="Promova o primeiro admin pelo SQL Editor do Supabase." />
          <Table
            columns={["Usuario", "Nome", "Papel", "Criado em"]}
            rows={profiles.map((profile) => [
              profile.user_id,
              profile.full_name ?? "-",
              profile.role,
              formatBrDate(profile.created_at)
            ])}
          />
        </Card>
        <Card>
          <CardHeader title="Ultimos lotes" />
          <Table
            columns={["Arquivo", "Linhas", "Validos", "Erros", "Status", "Criado em"]}
            rows={batches.map((batch) => [
              batch.file_name,
              batch.total_rows,
              batch.valid_cards,
              batch.error_rows,
              batch.status,
              formatBrDate(batch.created_at)
            ])}
          />
        </Card>
        <Card>
          <CardHeader title="Auditoria" />
          <Table
            columns={["Acao", "Entidade", "ID", "Criado em"]}
            rows={logs.map((log) => [
              log.action,
              log.entity_type ?? "-",
              log.entity_id ?? "-",
              formatBrDate(log.created_at)
            ])}
          />
        </Card>
      </div>
    </AppShell>
  );
}
