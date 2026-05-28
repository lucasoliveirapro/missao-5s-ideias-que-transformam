import { isSupabaseConfigured, supabase } from "../supabase.js";
import { IDEA_STATUSES, POINTS } from "../utils.js";

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
      .from("participants")
      .select("*")
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

  const { data: currentIdea, error: ideaError } = await supabase
    .from("ideas")
    .select("*")
    .eq("id", ideaId)
    .single();

  if (ideaError) {
    throw supabaseError(ideaError, "Não foi possível buscar a ideia.");
  }

  let bonus = 0;
  const ideaUpdate = {
    status: nextStatus,
    atualizado_em: new Date().toISOString()
  };

  if (nextStatus === "Aprovada" && !currentIdea.bonus_aprovada) {
    bonus += POINTS.approved;
    ideaUpdate.bonus_aprovada = true;
  }

  if (nextStatus === "Implantada" && !currentIdea.bonus_implantada) {
    bonus += POINTS.implemented;
    ideaUpdate.bonus_implantada = true;
  }

  if (bonus > 0) {
    ideaUpdate.pontos = Number(currentIdea.pontos || POINTS.idea) + bonus;
  }

  const { data: updatedIdea, error: updateError } = await supabase
    .from("ideas")
    .update(ideaUpdate)
    .eq("id", ideaId)
    .select("*")
    .single();

  if (updateError) {
    throw supabaseError(updateError, "Não foi possível atualizar o status.");
  }

  if (bonus > 0) {
    await addParticipantBonus(currentIdea.participant_id, currentIdea.matricula, bonus);
  }

  return updatedIdea;
}

async function addParticipantBonus(participantId, matricula, bonus) {
  const query = supabase.from("participants").select("*");
  const { data: participant, error } = participantId
    ? await query.eq("id", participantId).single()
    : await query.eq("matricula", matricula).single();

  if (error) {
    throw supabaseError(error, "Status atualizado, mas não foi possível buscar o participante para pontuar.");
  }

  const { error: updateError } = await supabase
    .from("participants")
    .update({
      total_pontos: Number(participant.total_pontos || 0) + bonus
    })
    .eq("id", participant.id);

  if (updateError) {
    throw supabaseError(updateError, "Status atualizado, mas não foi possível aplicar o bônus.");
  }
}

export async function clearEventData() {
  const ideasResult = await supabase.from("ideas").delete().not("id", "is", null);
  if (ideasResult.error) {
    throw supabaseError(ideasResult.error, "Não foi possível apagar as ideias.");
  }

  const participantsResult = await supabase.from("participants").delete().not("id", "is", null);
  if (participantsResult.error) {
    throw supabaseError(participantsResult.error, "Não foi possível apagar os participantes.");
  }
}
