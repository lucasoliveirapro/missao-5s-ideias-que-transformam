import { isFirebaseConfigured } from "../firebase.js";
import { countBy, escapeHtml, formatDateTime, formatNumber, getRankableParticipants, sortParticipants } from "../utils.js";
import { showToast } from "../ui/notifications.js";
import { loginAdmin, logoutAdmin, watchAdminAuth } from "./adminAuth.js";
import { exportIdeasCsv } from "./adminExport.js";
import { changeIdeaStatus, clearEventData, listenAdminData } from "./adminIdeas.js";

const state = {
  ideas: [],
  participants: [],
  unsubscribeData: null,
  filters: {
    search: "",
    turno: "",
    senso: "",
    status: ""
  }
};

const elements = {
  configWarning: document.getElementById("config-warning"),
  loginSection: document.getElementById("login-section"),
  loginForm: document.getElementById("login-form"),
  loginError: document.getElementById("login-error"),
  logoutButton: document.getElementById("logout-button"),
  adminPanel: document.getElementById("admin-panel"),
  adminUser: document.getElementById("admin-user"),
  dataStatus: document.getElementById("data-status"),
  summaryCards: document.getElementById("summary-cards"),
  ideasList: document.getElementById("ideas-list"),
  ideasCount: document.getElementById("ideas-count"),
  exportCsv: document.getElementById("export-csv"),
  clearEvent: document.getElementById("clear-event"),
  filters: {
    search: document.getElementById("admin-search"),
    turno: document.getElementById("admin-filter-turno"),
    senso: document.getElementById("admin-filter-senso"),
    status: document.getElementById("admin-filter-status")
  }
};

init();

function init() {
  if (!isFirebaseConfigured()) {
    elements.configWarning.hidden = false;
    elements.loginForm.querySelectorAll("input, button").forEach((element) => {
      element.disabled = true;
    });
    return;
  }

  bindEvents();
  watchAdminAuth(handleAuthState);
}

function bindEvents() {
  elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    elements.loginError.textContent = "";

    const email = elements.loginForm.elements.email.value.trim();
    const password = elements.loginForm.elements.password.value;
    const submitButton = elements.loginForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Entrando...";

    try {
      await loginAdmin(email, password);
      elements.loginForm.reset();
    } catch {
      elements.loginError.textContent = "Não foi possível entrar. Verifique e-mail e senha.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Entrar";
    }
  });

  elements.logoutButton.addEventListener("click", () => logoutAdmin());

  Object.entries(elements.filters).forEach(([key, input]) => {
    input.addEventListener("input", () => {
      state.filters[key] = input.value;
      renderIdeas();
    });
    input.addEventListener("change", () => {
      state.filters[key] = input.value;
      renderIdeas();
    });
  });

  elements.exportCsv.addEventListener("click", () => {
    exportIdeasCsv(state.ideas);
  });

  elements.clearEvent.addEventListener("click", async () => {
    const confirmed = window.confirm("Tem certeza que deseja apagar todos os dados do evento? Essa ação não poderá ser desfeita.");
    if (!confirmed) {
      return;
    }

    elements.clearEvent.disabled = true;
    elements.clearEvent.textContent = "Limpando...";
    try {
      const result = await clearEventData(state.ideas);
      showToast(`Dados limpos. Fotos removidas: ${result.photosDeleted}/${result.photosAttempted}.`, result.photosFailed ? "warning" : "success");
    } catch (error) {
      showToast(error.message || "Não foi possível limpar os dados.", "error");
    } finally {
      elements.clearEvent.disabled = false;
      elements.clearEvent.textContent = "Limpar dados do evento";
    }
  });
}

function handleAuthState(user) {
  if (!user) {
    elements.loginSection.hidden = false;
    elements.adminPanel.hidden = true;
    elements.logoutButton.hidden = true;
    elements.adminUser.textContent = "";
    stopDataListener();
    clearAdminData();
    return;
  }

  elements.loginSection.hidden = true;
  elements.adminPanel.hidden = false;
  elements.logoutButton.hidden = false;
  elements.adminUser.textContent = `Logado como ${user.email}`;
  startDataListener();
}

function startDataListener() {
  stopDataListener();
  elements.dataStatus.textContent = "Carregando dados...";
  state.unsubscribeData = listenAdminData(
    ({ ideas, participants }) => {
      state.ideas = ideas;
      state.participants = participants;
      elements.dataStatus.textContent = `Atualizado em ${formatDateTime(new Date().toISOString())}`;
      renderSummary();
      renderIdeas();
    },
    () => {
      showToast("Falha ao carregar dados administrativos.", "error");
      elements.dataStatus.textContent = "Erro ao carregar dados";
    }
  );
}

function stopDataListener() {
  if (state.unsubscribeData) {
    state.unsubscribeData();
    state.unsubscribeData = null;
  }
}

function clearAdminData() {
  state.ideas = [];
  state.participants = [];
  elements.summaryCards.innerHTML = "";
  elements.ideasList.innerHTML = "";
  elements.ideasCount.textContent = "0 ideias";
}

function renderSummary() {
  const ideasByTurno = countBy(state.ideas, "turno");
  const ideasBySenso = countBy(state.ideas, "senso");
  const ideasByStatus = countBy(state.ideas, "status");
  const top3 = sortParticipants(getRankableParticipants(state.participants)).slice(0, 3);

  elements.summaryCards.innerHTML = `
    ${summaryCard("Total de ideias", formatNumber(state.ideas.length))}
    ${summaryCard("Total de participantes", formatNumber(state.participants.length))}
    ${summaryCard("Ideias por turno", summaryList(ideasByTurno))}
    ${summaryCard("Ideias por senso", summaryList(ideasBySenso))}
    ${summaryCard("Ideias por status", summaryList(ideasByStatus))}
    ${summaryCard("Top 3", top3.length ? top3.map((item, index) => `${index + 1}º ${escapeHtml(item.nome)} — ${formatNumber(item.totalIdeias)} ideias`).join("<br>") : "Sem dados")}
  `;
}

function summaryCard(title, content) {
  return `
    <article class="summary-card">
      <span>${escapeHtml(title)}</span>
      <strong>${content}</strong>
    </article>
  `;
}

function summaryList(data) {
  const entries = Object.entries(data);
  if (!entries.length) {
    return "Sem dados";
  }

  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([label, total]) => `${escapeHtml(label)}: ${formatNumber(total)}`)
    .join("<br>");
}

function getFilteredIdeas() {
  const search = state.filters.search.trim().toLowerCase();
  return state.ideas.filter((idea) => {
    const matchesSearch = !search
      || String(idea.nome || "").toLowerCase().includes(search)
      || String(idea.matricula || "").includes(search);
    const matchesTurno = !state.filters.turno || idea.turno === state.filters.turno;
    const matchesSenso = !state.filters.senso || idea.senso === state.filters.senso;
    const matchesStatus = !state.filters.status || idea.status === state.filters.status;
    return matchesSearch && matchesTurno && matchesSenso && matchesStatus;
  });
}

function renderIdeas() {
  const filtered = getFilteredIdeas();
  elements.ideasCount.textContent = `${formatNumber(filtered.length)} ideias`;

  if (!filtered.length) {
    elements.ideasList.innerHTML = `<div class="empty-state">Nenhuma ideia encontrada.</div>`;
    return;
  }

  elements.ideasList.innerHTML = filtered.map(renderIdeaCard).join("");

  elements.ideasList.querySelectorAll("[data-status-select]").forEach((select) => {
    select.addEventListener("change", async (event) => {
      const ideaId = event.target.dataset.ideaId;
      const previous = event.target.dataset.currentStatus;
      event.target.disabled = true;

      try {
        const result = await changeIdeaStatus(ideaId, event.target.value);
        showToast(result.bonus ? `Status atualizado. Bônus aplicado: +${result.bonus} pontos.` : "Status atualizado.", "success");
      } catch (error) {
        event.target.value = previous;
        showToast(error.message || "Não foi possível atualizar o status.", "error");
      } finally {
        event.target.disabled = false;
      }
    });
  });
}

function renderIdeaCard(idea) {
  return `
    <article class="idea-admin-card">
      <div class="idea-photo">
        ${
          idea.fotoUrl
            ? `<img src="${escapeHtml(idea.fotoUrl)}" alt="Foto enviada para a ideia ${escapeHtml(idea.titulo || "")}" loading="lazy" />`
            : `<span>Sem foto</span>`
        }
      </div>
      <div class="idea-content">
        <div class="idea-card-header">
          <div>
            <h3>${escapeHtml(idea.titulo || "Sem título")}</h3>
            <p>${escapeHtml(idea.descricao || "")}</p>
          </div>
          <span class="status-chip">${escapeHtml(idea.status || "Recebida")}</span>
        </div>
        <dl class="idea-meta">
          <div><dt>Senso</dt><dd>${escapeHtml(idea.senso || "-")}</dd></div>
          <div><dt>Área/linha</dt><dd>${escapeHtml(idea.area || "-")}</dd></div>
          <div><dt>Nome</dt><dd>${escapeHtml(idea.nome || "-")}</dd></div>
          <div><dt>Matrícula</dt><dd>${escapeHtml(idea.matricula || "-")}</dd></div>
          <div><dt>Turno</dt><dd>${escapeHtml(idea.turno || "-")}</dd></div>
          <div><dt>Data/hora</dt><dd>${formatDateTime(idea.dataHora)}</dd></div>
          <div><dt>Pontos</dt><dd>${formatNumber(idea.pontos)}</dd></div>
        </dl>
        <label class="status-control">
          Alterar status
          <select data-status-select data-idea-id="${escapeHtml(idea.id)}" data-current-status="${escapeHtml(idea.status || "Recebida")}">
            ${["Recebida", "Em análise", "Aprovada", "Implantada", "Recusada"]
              .map((status) => `<option value="${escapeHtml(status)}" ${status === idea.status ? "selected" : ""}>${escapeHtml(status)}</option>`)
              .join("")}
          </select>
        </label>
      </div>
    </article>
  `;
}
