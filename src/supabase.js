import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL.trim() && SUPABASE_ANON_KEY.trim());
}

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;
