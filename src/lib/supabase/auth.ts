import { redirect } from "next/navigation";
import type { AppRole } from "@/types/database";
import { createServerSupabaseClient } from "./server";

const ROLE_ORDER: Record<AppRole, number> = {
  viewer: 1,
  leader: 2,
  admin: 3
};

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, profile };
}

export async function requireUser() {
  const current = await getCurrentUser();
  if (!current.user) {
    redirect("/login");
  }
  return current;
}

export async function requireRole(roles: AppRole[]) {
  const current = await requireUser();
  const role = current.profile?.role ?? "viewer";

  if (!roles.includes(role)) {
    redirect("/dashboard");
  }

  return { ...current, role };
}

export function hasAtLeastRole(role: AppRole | null | undefined, minimum: AppRole) {
  if (!role) {
    return false;
  }
  return ROLE_ORDER[role] >= ROLE_ORDER[minimum];
}
