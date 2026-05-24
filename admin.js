"use strict";

// ==================================================
// Configuração e autenticação simples
// ==================================================
// Use as mesmas credenciais do firebaseConfig configurado em script.js.
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

const ADMIN_PASSWORD = "#Santos102628";

let database = null;
let firebaseReady = false;
let ranking = [];

function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.databaseURL &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
  );
}

function handleLogin(event) {
  event.preventDefault();
  const password = document.getElementById("admin-password").value.trim();

  if (password !== ADMIN_PASSWORD) {
    setLoginStatus("Acesso negado.", "error");
    return;
  }

  document.getElementById("admin-login").hidden = true;
  document.getElementById("admin-panel").hidden = false;
  initFirebase();
}

function setLoginStatus(message, type) {
  const element = document.getElementById("admin-login-status");
  element.textContent = message;
  element.className = type ? `status-message ${type}` : "status-message";
}

// ==================================================
// Firebase
// ==================================================
function initFirebase() {
  if (!hasFirebaseConfig()) {
    setNotice(
      "Firebase não configurado. Preencha o firebaseConfig em admin.js com as mesmas credenciais do jogo.",
    );
    renderRanking();
    return;
  }

  if (!window.firebase) {
    setNotice("Firebase SDK não carregou. Verifique a conexão com a internet.");
    return;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    firebaseReady = true;
    setNotice("");
    listenRanking();
  } catch (error) {
    console.error("Erro ao iniciar Firebase:", error);
    setNotice("Não foi possível iniciar o Firebase. Confira as credenciais.");
  }
}

function listenRanking() {
  if (!firebaseReady) return;

  database.ref("participants").on(
    "value",
    (snapshot) => {
      const data = snapshot.val() || {};
      ranking = sortRanking(participantsFromRecord(data));
      renderRanking();
    },
    (error) => {
      console.error("Erro ao carregar ranking:", error);
      setNotice("Não foi possível carregar o ranking online agora.");
    },
  );
}

function setNotice(message) {
  const notice = document.getElementById("admin-firebase-notice");
  notice.textContent = message;
  notice.className = message ? "status-message error" : "status-message";
}

// ==================================================
// Ranking
// ==================================================
function sortRanking(participants) {
  return mergeParticipantsByRegistration(participants).sort((a, b) => {
    const totalDiff = Number(b.totalPontos || 0) - Number(a.totalPontos || 0);
    if (totalDiff) return totalDiff;
    const gamesDiff = Number(b.partidas || 0) - Number(a.partidas || 0);
    if (gamesDiff) return gamesDiff;
    const bestDiff =
      Number(b.melhorPartida || 0) - Number(a.melhorPartida || 0);
    if (bestDiff) return bestDiff;
    return (
      new Date(
        a.atingiuPontuacaoAtualEm || a.ultimaParticipacao || a.criadoEm || 0,
      ) -
      new Date(
        b.atingiuPontuacaoAtualEm || b.ultimaParticipacao || b.criadoEm || 0,
      )
    );
  });
}

function participantsFromRecord(record) {
  return Object.entries(record || {}).map(([key, value]) => ({
    ...(value || {}),
    matricula: normalizeRegistration(value?.matricula || key),
  }));
}

function mergeParticipantsByRegistration(participants) {
  const grouped = new Map();

  participants.filter(Boolean).forEach((participant) => {
    const matricula = normalizeRegistration(participant.matricula);
    if (!isValidRegistration(matricula)) return;

    const current = grouped.get(matricula);
    const normalized = {
      ...participant,
      nome: normalizeName(participant.nome || ""),
      turno: String(participant.turno || "").trim(),
      matricula,
      totalPontos: Number(participant.totalPontos || 0),
      partidas: Number(participant.partidas || 0),
      melhorPartida: Number(participant.melhorPartida || 0),
    };

    if (!current) {
      grouped.set(matricula, normalized);
      return;
    }

    const latest = getLatestParticipant(current, normalized);
    grouped.set(matricula, {
      ...current,
      nome: latest.nome,
      turno: latest.turno,
      matricula,
      totalPontos: Number(current.totalPontos || 0) + normalized.totalPontos,
      partidas: Number(current.partidas || 0) + normalized.partidas,
      melhorPartida: Math.max(
        Number(current.melhorPartida || 0),
        normalized.melhorPartida,
      ),
      ultimaParticipacao: getLatestDateValue(
        current.ultimaParticipacao,
        normalized.ultimaParticipacao,
      ),
      criadoEm: getEarliestDateValue(current.criadoEm, normalized.criadoEm),
      atingiuPontuacaoAtualEm: getEarliestDateValue(
        current.atingiuPontuacaoAtualEm,
        normalized.atingiuPontuacaoAtualEm,
      ),
    });
  });

  return Array.from(grouped.values());
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeRegistration(value) {
  return String(value || "").trim();
}

function isValidRegistration(value) {
  return /^\d+$/.test(normalizeRegistration(value));
}

function getLatestParticipant(a, b) {
  const firstDate = new Date(a.ultimaParticipacao || a.criadoEm || 0);
  const secondDate = new Date(b.ultimaParticipacao || b.criadoEm || 0);
  return secondDate > firstDate ? b : a;
}

function getLatestDateValue(a, b) {
  const firstDate = new Date(a || 0);
  const secondDate = new Date(b || 0);
  return secondDate > firstDate ? b || a : a || b;
}

function getEarliestDateValue(a, b) {
  if (!a) return b || "";
  if (!b) return a;
  return new Date(a) <= new Date(b) ? a : b;
}

function renderRanking() {
  renderTop3();
  renderRankingTable();
  const totalGames = ranking.reduce(
    (sum, participant) => sum + Number(participant.partidas || 0),
    0,
  );
  setText("admin-total-participants", String(ranking.length));
  setText("admin-total-games", String(totalGames));
}

function renderTop3() {
  const container = document.getElementById("admin-top3-grid");
  const medals = ["🥇", "🥈", "🥉"];

  if (ranking.length === 0) {
    container.innerHTML = `
      <div class="top-card">
        <div class="medal">🏁</div>
        <h3>Ranking em formação</h3>
        <p>Os resultados aparecerão aqui após as partidas.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = ranking
    .slice(0, 3)
    .map(
      (participant, index) => `
        <article class="top-card ${index === 0 ? "first" : ""}">
          <div class="medal">${medals[index]}</div>
          <h3>${index + 1}º ${escapeHtml(participant.nome)}</h3>
          <p><strong>Matrícula:</strong> ${escapeHtml(participant.matricula)}</p>
          <p><strong>Turno:</strong> ${escapeHtml(participant.turno)}</p>
          <p><strong>${Number(participant.totalPontos || 0)} pontos</strong></p>
          <p>${Number(participant.partidas || 0)} partidas • melhor ${Number(participant.melhorPartida || 0)}</p>
        </article>
      `,
    )
    .join("");
}

function renderRankingTable() {
  const body = document.getElementById("admin-ranking-table-body");
  const search = normalizeSearch(
    document.getElementById("admin-ranking-search").value,
  );
  const shift = document.getElementById("admin-ranking-shift-filter").value;

  const filtered = ranking.filter((participant) => {
    const searchTarget = normalizeSearch(
      `${participant.nome || ""} ${participant.matricula || ""}`,
    );
    const matchesSearch = !search || searchTarget.includes(search);
    const matchesShift = !shift || participant.turno === shift;
    return matchesSearch && matchesShift;
  });

  if (filtered.length === 0) {
    body.innerHTML = `<tr><td class="empty-row" colspan="8">Nenhum participante encontrado.</td></tr>`;
    return;
  }

  body.innerHTML = filtered
    .map((participant) => {
      const position =
        ranking.findIndex(
          (item) =>
            normalizeRegistration(item.matricula) ===
            normalizeRegistration(participant.matricula),
        ) + 1;
      return `
        <tr>
          <td>${position}º</td>
          <td>${escapeHtml(participant.nome)}</td>
          <td>${escapeHtml(participant.matricula)}</td>
          <td>${escapeHtml(participant.turno)}</td>
          <td>${Number(participant.totalPontos || 0)}</td>
          <td>${Number(participant.partidas || 0)}</td>
          <td>${Number(participant.melhorPartida || 0)}</td>
          <td>${formatDateTime(participant.ultimaParticipacao)}</td>
        </tr>
      `;
    })
    .join("");
}

// ==================================================
// Exportação CSV
// ==================================================
async function exportCsv() {
  setActionStatus("Preparando CSV...", "");

  if (!firebaseReady) {
    setActionStatus(
      "Configure o Firebase antes de exportar os dados online.",
      "error",
    );
    return;
  }

  try {
    const snapshot = await database.ref("attempts").once("value");
    const attempts = Object.values(snapshot.val() || {}).sort(
      (a, b) => new Date(a.dataHora || 0) - new Date(b.dataHora || 0),
    );

    if (attempts.length === 0) {
      setActionStatus("Não há resultados para exportar.", "error");
      return;
    }

    const rows = [
      [
        "Nome completo",
        "Matrícula",
        "Turno",
        "Pontuação da partida",
        "Pontuação acumulada após a partida",
        "Partidas jogadas após a partida",
        "Melhor pontuação após a partida",
        "Data e hora da partida",
      ],
      ...attempts.map((attempt) => [
        attempt.nome,
        attempt.matricula,
        attempt.turno,
        attempt.pontosPartida,
        attempt.pontosAcumuladosAposPartida,
        attempt.partidasAposPartida,
        attempt.melhorPartidaAposPartida,
        formatDateTime(attempt.dataHora),
      ]),
    ];

    const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
    downloadCsv(csv, "resultados-missao-5s.csv");
    setActionStatus("CSV exportado com sucesso.", "success");
  } catch (error) {
    console.error("Erro ao exportar CSV:", error);
    setActionStatus("Não foi possível exportar o CSV agora.", "error");
  }
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(csv, fileName) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ==================================================
// Limpeza de dados
// ==================================================
async function clearAllData() {
  const confirmed = window.confirm(
    "Tem certeza que deseja apagar todos os resultados? Essa ação não poderá ser desfeita.",
  );
  if (!confirmed) return;

  if (!firebaseReady) {
    setActionStatus(
      "Configure o Firebase antes de limpar os dados online.",
      "error",
    );
    return;
  }

  try {
    await database.ref("participants").remove();
    await database.ref("attempts").remove();
    ranking = [];
    renderRanking();
    setActionStatus("Dados apagados com sucesso.", "success");
  } catch (error) {
    console.error("Erro ao limpar dados:", error);
    setActionStatus("Não foi possível apagar os dados agora.", "error");
  }
}

function setActionStatus(message, type) {
  const element = document.getElementById("admin-action-status");
  element.textContent = message;
  element.className = type ? `status-message ${type}` : "status-message";
}

// ==================================================
// Utilidades
// ==================================================
function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function bindEvents() {
  document
    .getElementById("admin-login-form")
    .addEventListener("submit", handleLogin);
  document
    .getElementById("admin-ranking-search")
    .addEventListener("input", renderRankingTable);
  document
    .getElementById("admin-ranking-shift-filter")
    .addEventListener("change", renderRankingTable);
  document
    .getElementById("admin-export-csv-button")
    .addEventListener("click", exportCsv);
  document
    .getElementById("admin-clear-data-button")
    .addEventListener("click", clearAllData);
}

document.addEventListener("DOMContentLoaded", bindEvents);
