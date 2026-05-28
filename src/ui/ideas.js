import { isSupabaseConfigured, supabase } from "../supabase.js";
import {
  POINTS,
  findParticipantPosition,
  normalizeMatricula,
  nowIso,
  setStoredParticipant,
  sortParticipants
} from "../utils.js";

export const SUPABASE_CONFIG_MESSAGE =
  "Supabase ainda não configurado. O envio de ideias e ranking online dependem da configuração.";

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
    .from("participants")
    .select("*")
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
    const { data, error } = await supabase
      .from("participants")
      .update({
        nome: normalized.nome,
        turno: normalized.turno
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      throw asSupabaseError(error, "Não foi possível atualizar o participante.");
    }

    setStoredParticipant(publicParticipant(data));
    return data;
  }

  const { data, error } = await supabase
    .from("participants")
    .insert({
      nome: normalized.nome,
      matricula: normalized.matricula,
      turno: normalized.turno,
      total_ideias: 0,
      total_pontos: 0
    })
    .select("*")
    .single();

  if (error) {
    throw asSupabaseError(error, "Não foi possível criar o participante.");
  }

  setStoredParticipant(publicParticipant(data));
  return data;
}

export async function submitIdea(participant, formData) {
  if (!isSupabaseConfigured()) {
    throw new Error(SUPABASE_CONFIG_MESSAGE);
  }

  const savedParticipant = await registerParticipant(participant);
  const date = nowIso();

  const ideaPayload = {
    participant_id: savedParticipant.id,
    nome: savedParticipant.nome,
    matricula: savedParticipant.matricula,
    turno: savedParticipant.turno,
    titulo: String(formData.titulo).trim(),
    area: String(formData.area).trim(),
    descricao_local: String(formData.descricao_local).trim(),
    problema_observado: String(formData.problema_observado).trim(),
    sugestao_melhoria: String(formData.sugestao_melhoria).trim(),
    senso: formData.senso,
    status: "Recebida",
    pontos: POINTS.idea,
    bonus_aprovada: false,
    bonus_implantada: false,
    criado_em: date,
    atualizado_em: date
  };

  const { error: ideaError } = await supabase
    .from("ideas")
    .insert(ideaPayload);

  if (ideaError) {
    throw asSupabaseError(ideaError, "Não foi possível salvar a ideia.");
  }

  const updatedParticipantPayload = {
    nome: savedParticipant.nome,
    turno: savedParticipant.turno,
    total_ideias: Number(savedParticipant.total_ideias || 0) + 1,
    total_pontos: Number(savedParticipant.total_pontos || 0) + POINTS.idea,
    ultima_participacao: date
  };

  const { data: updatedParticipant, error: participantError } = await supabase
    .from("participants")
    .update(updatedParticipantPayload)
    .eq("id", savedParticipant.id)
    .select("*")
    .single();

  if (participantError) {
    throw asSupabaseError(participantError, "A ideia foi salva, mas não foi possível atualizar o ranking.");
  }

  setStoredParticipant(publicParticipant(updatedParticipant));

  const participants = await getParticipantsOnce();
  const rankPosition = findParticipantPosition(participants, updatedParticipant.matricula);

  return {
    idea: ideaPayload,
    participant: updatedParticipant,
    pointsAdded: POINTS.idea,
    rankPosition
  };
}

export async function getParticipantsOnce() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from("participants")
    .select("*")
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
