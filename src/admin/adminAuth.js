import { isSupabaseConfigured, supabase } from "../supabase.js";

export const ADMIN_ACCESS_DENIED_MESSAGE = "Acesso negado. Usuário não autorizado como administrador.";

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

export async function getAdminProfile(session) {
  if (!isSupabaseConfigured() || !session?.user?.id) {
    return null;
  }

  const { data, error } = await supabase
    .from("app_admins")
    .select("id, user_id, email")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Não foi possível validar o administrador.");
  }

  return data;
}

export async function requireAdminSession(session) {
  const profile = await getAdminProfile(session);

  if (!profile) {
    throw new Error(ADMIN_ACCESS_DENIED_MESSAGE);
  }

  return profile;
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
