import { isSupabaseConfigured } from "../supabase.js";
import {
  IDEA_STATUSES,
  SENSOS,
  TURNOS,
  countBy,
  escapeHtml,
  formatDateTime,
  formatNumber,
  participantIdeas,
  participantPoints,
  sortParticipants
} from "../utils.js";
import {
  ADMIN_ACCESS_DENIED_MESSAGE,
  getCurrentSession,
  onAdminAuthChange,
  requireAdminSession,
  signInAdmin,
  signOutAdmin
} from "./adminAuth.js";
import { clearEventData, loadAdminData, updateIdeaStatus } from "./adminIdeas.js";
import { exportIdeasCsv } from "./adminExport.js";

let state = {
  session: null,
  adminProfile: null,
  ideas: [],
  participants: [],
  filteredIdeas: []
};

let authCheckId = 0;
let preservedAuthMessage = "";
let loginInProgress = false;

const loginPanel = document.getElementById("admin-login-panel");
const appPanel = document.getElementById("admin-app-panel");
const loginForm = document.getElementById("admin-login-form");
const loginError = document.getElementById("admin-login-error");
const signOutButton = document.getElementById("admin-signout");
const notice = document.getElementById("admin-notice");
const summary = document.getElementById("admin-summary");
const list = document.getElementById("admin-ideas-list");
const countLabel = document.getElementById("admin-count");
const searchInput = document.getElementById("admin-search");
const turnoFilter = document.getElementById("admin-turno");
const sensoFilter = document.getElementById("admin-senso");
const statusFilter = document.getElementById("admin-status");
const exportButton = document.getElementById("admin-export");
const clearButton = document.getElementById("admin-clear");

async function setupAdminLogos() {
  const logoElements = [...document.querySelectorAll("[data-campaign-logo]")];
  if (!logoElements.length) {
    return;
  }

  try {
    const response = await fetch("/assets/images/logo-missao-5s.png", {
      method: "HEAD",
      cache: "no-store"
    });

    if (response.ok) {
      logoElements.forEach((logo) => {
        logo.src = "/assets/images/logo-missao-5s.png";
      });
    }
  } catch {
    // Keep the SVG fallback; the admin must not depend on optional PNG assets.
  }
}

function setNotice(message, type = "info") {
  notice.hidden = !message;
  notice.textContent = message || "";
  notice.dataset.type = type;
}

function setLoggedIn(loggedIn) {
  loginPanel.hidden = loggedIn;
  appPanel.hidden = !loggedIn;
}

function clearAdminState() {
  state = {
    ...state,
    session: null,
    adminProfile: null,
    ideas: [],
    participants: [],
    filteredIdeas: []
  };
  summary.innerHTML = "";
  list.innerHTML = "";
  countLabel.textContent = "0 registros";
  setNotice("");
}

function fillFilter(select, options, allLabel) {
  select.innerHTML = [`<option value="">${allLabel}</option>`, ...options.map((option) => (
    `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`
  ))].join("");
}

function setupFilters() {
  fillFilter(turnoFilter, TURNOS, "Todos");
  fillFilter(sensoFilter, SENSOS, "Todos");
  fillFilter(statusFilter, IDEA_STATUSES, "Todos");
  [searchInput, turnoFilter, sensoFilter, statusFilter].forEach((element) => {
    element.addEventListener("input", renderIdeas);
    element.addEventListener("change", renderIdeas);
  });
}

function renderSummary() {
  const totalPorTurno = countBy(state.ideas, "turno");
  const totalPorSenso = countBy(state.ideas, "senso");
  const totalPorStatus = countBy(state.ideas, "status");
  const top3 = sortParticipants(state.participants).slice(0, 3);

  summary.innerHTML = `
    ${summaryCard("Gols de ideia", formatNumber(state.ideas.length))}
    ${summaryCard("Participantes escalados", formatNumber(state.participants.length))}
    ${summaryCard("Ideias por turno", mapCount(totalPorTurno))}
    ${summaryCard("Ideias por senso", mapCount(totalPorSenso))}
    ${summaryCard("Ideias por status", mapCount(totalPorStatus))}
    ${summaryCard("Artilheiros", top3.length ? top3.map((item, index) => `${index + 1}º ${escapeHtml(item.nome)} — ${formatNumber(participantIdeas(item))} gols`).join("<br>") : "Sem ranking")}
  `;
}

function summaryCard(title, value) {
  return `
    <article class="summary-card">
      <span>${title}</span>
      <strong>${value}</strong>
    </article>
  `;
}

function mapCount(map) {
  const entries = Object.entries(map);
  if (!entries.length) {
    return "Sem dados";
  }

  return entries
    .map(([label, total]) => `${escapeHtml(label)}: ${formatNumber(total)}`)
    .join("<br>");
}

function getFilteredIdeas() {
  const search = String(searchInput.value || "").trim().toLowerCase();
  const turno = turnoFilter.value;
  const senso = sensoFilter.value;
  const status = statusFilter.value;

  return state.ideas.filter((idea) => {
    const matchesSearch = !search
      || String(idea.nome || "").toLowerCase().includes(search)
      || String(idea.matricula || "").includes(search);
    const matchesTurno = !turno || idea.turno === turno;
    const matchesSenso = !senso || idea.senso === senso;
    const matchesStatus = !status || idea.status === status;
    return matchesSearch && matchesTurno && matchesSenso && matchesStatus;
  });
}

function renderIdeas() {
  state.filteredIdeas = getFilteredIdeas();
  countLabel.textContent = `${formatNumber(state.filteredIdeas.length)} registros`;

  if (!state.filteredIdeas.length) {
    list.innerHTML = `<div class="empty-state">Nenhuma jogada encontrada.</div>`;
    return;
  }

  list.innerHTML = state.filteredIdeas.map(renderIdeaCard).join("");
  list.querySelectorAll("[data-status-id]").forEach((select) => {
    select.addEventListener("change", async () => {
      const id = select.dataset.statusId;
      const previous = select.dataset.previous;
      select.disabled = true;
      setNotice("Atualizando status...", "info");

      try {
        await updateIdeaStatus(id, select.value);
        await refreshData();
        setNotice("Status atualizado.", "success");
      } catch (error) {
        select.value = previous;
        setNotice(error.message || "Não foi possível atualizar o status.", "error");
      } finally {
        select.disabled = false;
      }
    });
  });
}

function renderIdeaCard(idea) {
  const resolved = Boolean(idea.resolvida);
  const resolutionDetails = idea.descricao_resolucao
    ? `<div><dt>Como resolveu</dt><dd>${escapeHtml(idea.descricao_resolucao)}</dd></div>`
    : "";

  return `
    <article class="idea-card">
      <div class="idea-card-header">
        <div>
          <h3>${escapeHtml(idea.titulo)}</h3>
          <p>${escapeHtml(idea.area)} • ${escapeHtml(idea.senso)}</p>
        </div>
        <div class="status-control">
          <label>
            Status
            <select data-status-id="${escapeHtml(idea.id)}" data-previous="${escapeHtml(idea.status)}">
              ${IDEA_STATUSES.map((status) => (
                `<option value="${escapeHtml(status)}" ${status === idea.status ? "selected" : ""}>${escapeHtml(status)}</option>`
              )).join("")}
            </select>
          </label>
        </div>
      </div>
      <dl class="idea-details">
        <div><dt>Local</dt><dd>${escapeHtml(idea.descricao_local)}</dd></div>
        <div><dt>Problema</dt><dd>${escapeHtml(idea.problema_observado)}</dd></div>
        <div><dt>Sugestão</dt><dd>${escapeHtml(idea.sugestao_melhoria)}</dd></div>
        <div><dt>Resolvida</dt><dd>${resolved ? "Sim" : "Não"}</dd></div>
        ${resolutionDetails}
      </dl>
      <div class="idea-meta">
        <span>${escapeHtml(idea.nome)} — Matrícula ${escapeHtml(idea.matricula)}</span>
        <span>${escapeHtml(idea.turno)}</span>
        <span>${formatDateTime(idea.criado_em)}</span>
        <strong>${formatNumber(idea.pontos)} pts</strong>
      </div>
    </article>
  `;
}

async function refreshData() {
  const data = await loadAdminData();
  state = {
    ...state,
    ideas: data.ideas,
    participants: data.participants
  };
  renderSummary();
  renderIdeas();
}

async function handleLogin(event) {
  event.preventDefault();
  loginError.textContent = "";
  const formData = new FormData(loginForm);
  const button = loginForm.querySelector("button");
  button.disabled = true;
  button.textContent = "Entrando...";

  try {
    loginInProgress = true;
    await signInAdmin(formData.get("email"), formData.get("password"));
    const session = await getCurrentSession();
    await handleAdminSession(session);
  } catch (error) {
    loginError.textContent = error.message || "Não foi possível entrar.";
  } finally {
    loginInProgress = false;
    button.disabled = false;
    button.textContent = "Entrar";
  }
}

async function handleAdminSession(session) {
  const currentCheck = ++authCheckId;
  setNotice("");

  if (!session) {
    const message = preservedAuthMessage;
    preservedAuthMessage = "";
    clearAdminState();
    setLoggedIn(false);
    loginError.textContent = message;
    return;
  }

  clearAdminState();
  setLoggedIn(false);
  loginError.textContent = "Validando permissão administrativa...";

  try {
    const adminProfile = await requireAdminSession(session);

    if (currentCheck !== authCheckId) {
      return;
    }

    state.session = session;
    state.adminProfile = adminProfile;
    loginError.textContent = "";
    setLoggedIn(true);
    await refreshData();
  } catch (error) {
    if (currentCheck !== authCheckId) {
      return;
    }

    const message = error.message || ADMIN_ACCESS_DENIED_MESSAGE;
    clearAdminState();
    setLoggedIn(false);
    loginError.textContent = message;

    if (message === ADMIN_ACCESS_DENIED_MESSAGE) {
      preservedAuthMessage = ADMIN_ACCESS_DENIED_MESSAGE;
      await signOutAdmin().catch(() => {});
      loginError.textContent = ADMIN_ACCESS_DENIED_MESSAGE;
    }
  }
}

async function bootAdmin() {
  setupAdminLogos();
  setupFilters();

  if (!isSupabaseConfigured()) {
    loginError.textContent = "Supabase ainda não configurado. Configure URL e ANON KEY em src/supabase.js.";
    loginForm.querySelector("button").disabled = true;
    setLoggedIn(false);
    return;
  }

  loginForm.addEventListener("submit", handleLogin);
  signOutButton.addEventListener("click", async () => {
    preservedAuthMessage = "";
    loginError.textContent = "";
    await signOutAdmin();
    clearAdminState();
    setLoggedIn(false);
  });
  exportButton.addEventListener("click", () => exportIdeasCsv(state.ideas));
  clearButton.addEventListener("click", async () => {
    const confirmed = window.confirm("Tem certeza que deseja apagar todos os dados do evento? Essa ação não poderá ser desfeita.");
    if (!confirmed) return;

    clearButton.disabled = true;
    setNotice("Limpando dados do evento...", "info");
    try {
      await clearEventData();
      await refreshData();
      setNotice("Dados do evento apagados.", "success");
    } catch (error) {
      setNotice(error.message || "Não foi possível limpar os dados.", "error");
    } finally {
      clearButton.disabled = false;
    }
  });

  onAdminAuthChange((session, event) => {
    if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
      return;
    }

    if (event === "SIGNED_IN" && loginInProgress) {
      return;
    }

    handleAdminSession(session).catch((error) => {
      clearAdminState();
      setLoggedIn(false);
      loginError.textContent = error.message || "Erro ao validar a sessão.";
    });
  });

  state.session = await getCurrentSession();
  await handleAdminSession(state.session);
}

bootAdmin().catch((error) => {
  loginError.textContent = error.message || "Erro ao iniciar o painel.";
});
