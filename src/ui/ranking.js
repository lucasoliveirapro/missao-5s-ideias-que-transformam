import {
  TURNOS,
  escapeHtml,
  formatDateTime,
  formatNumber,
  getRankableParticipants,
  sortParticipants
} from "../utils.js";
import { hideOverlay, showOverlay } from "./notifications.js";

let rankingState = {
  participants: [],
  onBack: null
};

export function showRankingPanel(participants, { onBack } = {}) {
  rankingState = {
    participants: sortParticipants(getRankableParticipants(participants)),
    onBack
  };

  showOverlay(
    `
      <section class="ranking-panel" aria-labelledby="ranking-title">
        <div class="ranking-panel-header">
          <div>
            <p class="eyebrow">Ranking público</p>
            <h2 id="ranking-title">🏆 Top 3 — Quem mais lançou ideias</h2>
          </div>
          <button class="ghost-button" type="button" data-action="back">Voltar</button>
        </div>

        <div class="ranking-filters">
          <label>
            Busca
            <input id="ranking-search" type="search" placeholder="Nome ou matrícula" />
          </label>
          <label>
            Turno
            <select id="ranking-turno">
              <option value="">Todos</option>
              ${TURNOS.map((turno) => `<option value="${escapeHtml(turno)}">${escapeHtml(turno)}</option>`).join("")}
            </select>
          </label>
        </div>

        <div id="ranking-list" class="ranking-list"></div>
      </section>
    `,
    { className: "overlay-root ranking-root active" }
  );

  const root = document.getElementById("overlay-root");
  root.querySelector('[data-action="back"]').addEventListener("click", () => {
    hideOverlay();
    if (rankingState.onBack) rankingState.onBack();
  });
  root.querySelector("#ranking-search").addEventListener("input", renderRankingList);
  root.querySelector("#ranking-turno").addEventListener("change", renderRankingList);
  renderRankingList();
}

export function updateRankingPanel(participants) {
  rankingState.participants = sortParticipants(getRankableParticipants(participants));
  if (document.getElementById("ranking-list")) {
    renderRankingList();
  }
}

export function closeRankingPanel() {
  hideOverlay();
}

function getFilteredParticipants() {
  const root = document.getElementById("overlay-root");
  const search = String(root?.querySelector("#ranking-search")?.value || "").trim().toLowerCase();
  const turno = root?.querySelector("#ranking-turno")?.value || "";

  return rankingState.participants.filter((participant) => {
    const matchesSearch = !search
      || String(participant.nome || "").toLowerCase().includes(search)
      || String(participant.matricula || "").includes(search);
    const matchesTurno = !turno || participant.turno === turno;
    return matchesSearch && matchesTurno;
  });
}

function renderRankingList() {
  const list = document.getElementById("ranking-list");
  if (!list) {
    return;
  }

  const filtered = getFilteredParticipants();

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">Nenhum participante encontrado.</div>`;
    return;
  }

  list.innerHTML = filtered
    .map((participant) => {
      const position = rankingState.participants.findIndex((item) => item.matricula === participant.matricula) + 1;
      return `
        <article class="ranking-row">
          <div class="rank-position">${position}º</div>
          <div class="rank-person">
            <strong>${escapeHtml(participant.nome || "Participante")}</strong>
            <span>Matrícula ${escapeHtml(participant.matricula || "-")} • ${escapeHtml(participant.turno || "-")}</span>
          </div>
          <div class="rank-metric">
            <strong>${formatNumber(participant.totalIdeias)}</strong>
            <span>ideias</span>
          </div>
          <div class="rank-metric">
            <strong>${formatNumber(participant.totalPontos)}</strong>
            <span>pontos</span>
          </div>
          <div class="rank-date">${formatDateTime(participant.ultimaParticipacao)}</div>
        </article>
      `;
    })
    .join("");
}
