import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { assertPublicSupabaseEnv, getServiceRoleKey } from "@/lib/env";

export function createAdminSupabaseClient() {
  const { url } = assertPublicSupabaseEnv();

  return createClient<Database>(url, getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
