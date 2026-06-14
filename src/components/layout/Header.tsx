import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AppRole } from "@/types/database";

export function Header({
  profile
}: {
  profile: { full_name: string | null; role: AppRole } | null;
}) {
  return (
    <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div>
        <p className="text-sm font-semibold text-slate-950">
          {profile?.full_name || "Usuario autenticado"}
        </p>
        <p className="text-xs uppercase tracking-wide text-slate-500">{profile?.role ?? "viewer"}</p>
      </div>
      <form action="/api/auth/sign-out" method="post">
        <Button variant="ghost" type="submit">
          <LogOut className="size-4" aria-hidden="true" />
          Sair
        </Button>
      </form>
    </header>
  );
}
