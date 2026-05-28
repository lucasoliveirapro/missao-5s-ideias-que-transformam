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
  photo: 5,
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

export function validateIdea({ titulo, descricao, senso, area, foto }) {
  if (!String(titulo || "").trim()) {
    return { valid: false, message: "Informe o título da ideia." };
  }

  if (!String(descricao || "").trim()) {
    return { valid: false, message: "Informe a descrição da melhoria." };
  }

  if (!SENSOS.includes(senso)) {
    return { valid: false, message: "Selecione o senso relacionado." };
  }

  if (!String(area || "").trim()) {
    return { valid: false, message: "Informe a área ou linha." };
  }

  if (!foto) {
    return { valid: false, message: "Envie uma foto do local." };
  }

  if (!foto.type || !foto.type.startsWith("image/")) {
    return { valid: false, message: "A foto deve ser uma imagem válida." };
  }

  if (foto.size > 5 * 1024 * 1024) {
    return { valid: false, message: "A foto deve ter no máximo 5MB." };
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

export function sortParticipants(participants) {
  return [...participants].sort((a, b) => {
    const ideasDiff = Number(b.totalIdeias || 0) - Number(a.totalIdeias || 0);
    if (ideasDiff !== 0) return ideasDiff;

    const pointsDiff = Number(b.totalPontos || 0) - Number(a.totalPontos || 0);
    if (pointsDiff !== 0) return pointsDiff;

    const aDate = Date.parse(a.ultimaParticipacao || "") || Number.POSITIVE_INFINITY;
    const bDate = Date.parse(b.ultimaParticipacao || "") || Number.POSITIVE_INFINITY;
    return aDate - bDate;
  });
}

export function getRankableParticipants(participants) {
  return participants.filter((participant) => Number(participant.totalIdeias || 0) > 0);
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

export function makeSafeFileName(fileName) {
  const fallback = "foto-local.jpg";
  return String(fileName || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90) || fallback;
}

export function countBy(items, key) {
  return items.reduce((acc, item) => {
    const label = item[key] || "Não informado";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
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
