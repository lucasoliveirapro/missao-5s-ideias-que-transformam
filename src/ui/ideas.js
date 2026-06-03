import { isSupabaseConfigured, supabase } from "../supabase.js";
import {
  POINTS,
  findParticipantPosition,
  normalizeMatricula,
  setStoredParticipant,
  sortParticipants
} from "../utils.js";

export const SUPABASE_CONFIG_MESSAGE =
  "Supabase ainda não configurado. O envio de ideias e ranking online dependem da configuração.";

const RANKING_COLUMNS = "nome, matricula, turno, total_ideias, total_pontos, ultima_participacao";

function asSupabaseError(error, fallback) {
  if (!error) {
    return new Error(fallback);
  }

  return new Error(error.message || fallback);
}

function snapshotParticipants(rows) {
  return sortParticipants(Array.isArray(rows) ? rows : []);
}

function publicParticipant(participant) {
  return {
    nome: participant.nome,
    matricula: participant.matricula,
    turno: participant.turno
  };
}

export async function getParticipantByMatricula(matricula) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from("public_ranking")
    .select(RANKING_COLUMNS)
    .eq("matricula", normalizeMatricula(matricula))
    .maybeSingle();

  if (error) {
    throw asSupabaseError(error, "Não foi possível buscar o participante.");
  }

  return data;
}

export async function registerParticipant(participant) {
  const normalized = {
    ...participant,
    matricula: normalizeMatricula(participant.matricula)
  };

  setStoredParticipant(publicParticipant(normalized));

  if (!isSupabaseConfigured()) {
    return {
      ...normalized,
      total_ideias: 0,
      total_pontos: 0,
      ultima_participacao: null
    };
  }

  const existing = await getParticipantByMatricula(normalized.matricula);

  if (existing) {
    const displayParticipant = {
      ...existing,
      nome: normalized.nome,
      turno: normalized.turno
    };
    setStoredParticipant(publicParticipant(displayParticipant));
    return displayParticipant;
  }

  const pendingParticipant = {
    ...normalized,
    total_ideias: 0,
    total_pontos: 0,
    ultima_participacao: null
  };

  setStoredParticipant(publicParticipant(pendingParticipant));
  return pendingParticipant;
}

export async function submitIdea(participant, formData) {
  if (!isSupabaseConfigured()) {
    throw new Error(SUPABASE_CONFIG_MESSAGE);
  }

  const normalizedParticipant = await registerParticipant(participant);

  const { data: result, error } = await supabase.rpc("submit_idea", {
    p_nome: normalizedParticipant.nome,
    p_matricula: normalizedParticipant.matricula,
    p_turno: normalizedParticipant.turno,
    p_titulo: String(formData.titulo).trim(),
    p_area: String(formData.area).trim(),
    p_descricao_local: String(formData.descricao_local).trim(),
    p_problema_observado: String(formData.problema_observado).trim(),
    p_sugestao_melhoria: String(formData.sugestao_melhoria).trim(),
    p_senso: formData.senso,
    p_resolvida: Boolean(formData.resolvida),
    p_descricao_resolucao: formData.resolvida ? String(formData.descricao_resolucao).trim() : null
  });

  if (error) {
    throw asSupabaseError(error, "Não foi possível salvar a ideia.");
  }

  const updatedParticipant = await getParticipantByMatricula(normalizedParticipant.matricula);

  if (!updatedParticipant) {
    throw new Error("A ideia foi salva, mas não foi possível atualizar o ranking.");
  }

  setStoredParticipant(publicParticipant(updatedParticipant));

  const participants = await getParticipantsOnce();
  const rankPosition = findParticipantPosition(participants, updatedParticipant.matricula);

  return {
    idea: result,
    participant: updatedParticipant,
    resolved: Boolean(formData.resolvida),
    pointsAdded: Number(result?.pontos_adicionados || (formData.resolvida ? POINTS.resolvedIdea : POINTS.idea)),
    rankPosition
  };
}

export async function getParticipantsOnce() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from("public_ranking")
    .select(RANKING_COLUMNS)
    .order("total_ideias", { ascending: false })
    .order("total_pontos", { ascending: false })
    .order("ultima_participacao", { ascending: true, nullsFirst: false });

  if (error) {
    throw asSupabaseError(error, "Não foi possível carregar o ranking.");
  }

  return snapshotParticipants(data);
}

export function observeParticipants(callback, onError) {
  let disposed = false;
  let intervalId;

  async function load() {
    try {
      const participants = await getParticipantsOnce();
      if (!disposed) {
        callback(participants);
      }
    } catch (error) {
      if (!disposed && onError) {
        onError(error);
      }
    }
  }

  load();

  if (isSupabaseConfigured()) {
    intervalId = window.setInterval(load, 15000);
  }

  return () => {
    disposed = true;
    if (intervalId) {
      window.clearInterval(intervalId);
    }
  };
}
