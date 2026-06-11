import { NextResponse } from "next/server";
import type { AppRole } from "@/types/database";
import { createServerSupabaseClient } from "./server";

export async function getApiContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Nao autenticado." }, { status: 401 })
    };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    ok: true as const,
    supabase,
    user,
    profile,
    role: profile?.role ?? ("viewer" as AppRole)
  };
}

export async function requireApiRole(roles: AppRole[]) {
  const context = await getApiContext();
  if (!context.ok) {
    return context;
  }

  if (!roles.includes(context.role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    };
  }

  return context;
}
