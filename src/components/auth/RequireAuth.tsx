import { requireUser } from "@/lib/supabase/auth";

export async function RequireAuth({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}
