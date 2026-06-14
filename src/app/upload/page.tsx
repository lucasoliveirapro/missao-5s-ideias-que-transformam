import { AppShell } from "@/components/layout/AppShell";
import { UploadSsFile } from "@/components/upload/UploadSsFile";
import { requireRole } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  await requireRole(["admin", "leader"]);

  return (
    <AppShell>
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Importar base SS</h1>
          <p className="mt-1 text-sm text-slate-600">
            O processamento acontece no backend; arquivos originais nao sao salvos no banco.
          </p>
        </div>
        <UploadSsFile />
      </div>
    </AppShell>
  );
}
