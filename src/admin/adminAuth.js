import { isSupabaseConfigured, supabase } from "../supabase.js";

export async function getCurrentSession() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message || "Não foi possível verificar a sessão.");
  }
  return data.session;
}

export function onAdminAuthChange(callback) {
  if (!isSupabaseConfigured()) {
    callback(null);
    return () => {};
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function signInAdmin(email, password) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase ainda não configurado.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(error.message || "Não foi possível entrar.");
  }

  return data.session;
}

export async function signOutAdmin() {
  if (!isSupabaseConfigured()) {
    return;
  }

  await supabase.auth.signOut();
}
