import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bytsvhphsnrnbuofkhjl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZafEhoy019l9Y1e8rOkXvg_0m-xSt0f";

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
