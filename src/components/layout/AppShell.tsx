import { requireUser } from "@/lib/supabase/auth";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const { profile } = await requireUser();

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Header
          profile={
            profile
              ? {
                  full_name: profile.full_name,
                  role: profile.role
                }
              : null
          }
        />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
