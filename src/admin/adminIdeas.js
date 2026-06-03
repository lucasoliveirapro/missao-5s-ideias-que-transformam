import { isSupabaseConfigured, supabase } from "../supabase.js";
import { IDEA_STATUSES } from "../utils.js";

function supabaseError(error, fallback) {
  return new Error(error?.message || fallback);
}

export async function loadAdminData() {
  if (!isSupabaseConfigured()) {
    return { ideas: [], participants: [] };
  }

  const [ideasResult, participantsResult] = await Promise.all([
    supabase.from("ideas").select("*").order("criado_em", { ascending: false }),
    supabase
      .from("public_ranking")
      .select("nome, matricula, turno, total_ideias, total_pontos, ultima_participacao")
      .order("total_ideias", { ascending: false })
      .order("total_pontos", { ascending: false })
      .order("ultima_participacao", { ascending: true, nullsFirst: false })
  ]);

  if (ideasResult.error) {
    throw supabaseError(ideasResult.error, "Não foi possível carregar as ideias.");
  }

  if (participantsResult.error) {
    throw supabaseError(participantsResult.error, "Não foi possível carregar os participantes.");
  }

  return {
    ideas: ideasResult.data || [],
    participants: participantsResult.data || []
  };
}

export async function updateIdeaStatus(ideaId, nextStatus) {
  if (!IDEA_STATUSES.includes(nextStatus)) {
    throw new Error("Status inválido.");
  }

  const { error } = await supabase.rpc("admin_update_idea_status", {
    p_idea_id: ideaId,
    p_status: nextStatus
  });

  if (error) {
    throw supabaseError(error, "Não foi possível atualizar o status.");
  }
}

export async function clearEventData() {
  const { error } = await supabase.rpc("admin_clear_event");

  if (error) {
    throw supabaseError(error, "Não foi possível apagar os dados do evento.");
  }
}
