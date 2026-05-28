export const TURNOS = ["1º Turno", "2º Turno", "3º Turno"];

export const SENSOS = [
  "SEIRI — Utilização",
  "SEITON — Organização",
  "SEISOU — Limpeza",
  "SEIKETSU — Saúde",
  "SHITSUKE — Disciplina"
];

export const IDEA_STATUSES = ["Recebida", "Em análise", "Aprovada", "Implantada", "Recusada"];

export const POINTS = {
  idea: 10,
  approved: 20,
  implemented: 50
};

export const PARTICIPANT_STORAGE_KEY = "missao5s.participante";

export function normalizeMatricula(value) {
  return String(value || "").replace(/\s+/g, "");
}

export function hasFullName(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length >= 2;
}

export function validateParticipant({ nome, matricula, turno }) {
  const normalizedMatricula = normalizeMatricula(matricula);

  if (!hasFullName(nome)) {
    return { valid: false, message: "Informe seu nome completo." };
  }

  if (!normalizedMatricula || !/^\d+$/.test(normalizedMatricula)) {
    return { valid: false, message: "A matrícula deve conter apenas números." };
  }

  if (!TURNOS.includes(turno)) {
    return { valid: false, message: "Selecione o turno." };
  }

  return {
    valid: true,
    participant: {
      nome: String(nome).trim().replace(/\s+/g, " "),
      matricula: normalizedMatricula,
      turno
    }
  };
}

export function validateIdea({
  titulo,
  area,
  descricao_local,
  problema_observado,
  sugestao_melhoria,
  senso
}) {
  if (!String(titulo || "").trim()) {
    return { valid: false, message: "Informe o título da ideia." };
  }

  if (!String(area || "").trim()) {
    return { valid: false, message: "Informe a área ou linha." };
  }

  if (String(descricao_local || "").trim().length < 15) {
    return { valid: false, message: "Descreva o local com pelo menos 15 caracteres." };
  }

  if (String(problema_observado || "").trim().length < 15) {
    return { valid: false, message: "Explique o problema observado com pelo menos 15 caracteres." };
  }

  if (String(sugestao_melhoria || "").trim().length < 15) {
    return { valid: false, message: "Descreva a sugestão de melhoria com pelo menos 15 caracteres." };
  }

  if (!SENSOS.includes(senso)) {
    return { valid: false, message: "Selecione o senso relacionado." };
  }

  return { valid: true };
}

export function setStoredParticipant(participant) {
  localStorage.setItem(PARTICIPANT_STORAGE_KEY, JSON.stringify(participant));
}

export function getStoredParticipant() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PARTICIPANT_STORAGE_KEY) || "null");
    if (!parsed || !parsed.matricula) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredParticipant() {
  localStorage.removeItem(PARTICIPANT_STORAGE_KEY);
}

export function nowIso() {
  return new Date().toISOString();
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString("pt-BR");
}

export function participantIdeas(participant) {
  return Number(participant?.total_ideias || 0);
}

export function participantPoints(participant) {
  return Number(participant?.total_pontos || 0);
}

export function sortParticipants(participants) {
  return [...participants].sort((a, b) => {
    const ideasDiff = participantIdeas(b) - participantIdeas(a);
    if (ideasDiff !== 0) return ideasDiff;

    const pointsDiff = participantPoints(b) - participantPoints(a);
    if (pointsDiff !== 0) return pointsDiff;

    const aDate = Date.parse(a.ultima_participacao || "") || Number.POSITIVE_INFINITY;
    const bDate = Date.parse(b.ultima_participacao || "") || Number.POSITIVE_INFINITY;
    return aDate - bDate;
  });
}

export function getRankableParticipants(participants) {
  return participants.filter((participant) => participantIdeas(participant) > 0);
}

export function findParticipantPosition(participants, matricula) {
  const ranking = sortParticipants(getRankableParticipants(participants));
  const index = ranking.findIndex((participant) => participant.matricula === matricula);
  return index >= 0 ? index + 1 : null;
}

export function getAssetPath(relativePath) {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return `${normalizedBase}assets/${relativePath.replace(/^\/+/, "")}`;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function countBy(items, key) {
  return items.reduce((acc, item) => {
    const label = item[key] || "Não informado";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
}

export function toCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function shouldPauseCanvasResize() {
  const overlayRoot = document.getElementById("overlay-root");
  const overlayOpen = Boolean(
    document.body.classList.contains("has-active-overlay")
      || (overlayRoot?.classList.contains("active") && overlayRoot.innerHTML.trim())
  );
  const activeElement = document.activeElement;
  const formFieldFocused = Boolean(activeElement?.matches?.("input, textarea, select"));
  return overlayOpen || formFieldFocused;
}
