"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { assertPublicSupabaseEnv } from "@/lib/env";

export function createBrowserSupabaseClient() {
  const { url, anonKey } = assertPublicSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
