import { audioManager } from "../audio.js";
import { isSupabaseConfigured } from "../supabase.js";
import {
  SENSOS,
  TURNOS,
  escapeHtml,
  formatNumber,
  normalizeMatricula,
  validateIdea,
  validateParticipant
} from "../utils.js";
import { SUPABASE_CONFIG_MESSAGE, registerParticipant, submitIdea } from "./ideas.js";
import { hideOverlay, setBusy, showOverlay, showToast } from "./notifications.js";

const IDEA_DRAFT_PREFIX = "missao5s.ideaDraft.";

function fieldValue(form, name) {
  return form.elements[name]?.value || "";
}

function ideaDraftKey(participant) {
  return `${IDEA_DRAFT_PREFIX}${normalizeMatricula(participant?.matricula) || "sem-matricula"}`;
}

function readIdeaDraft(participant) {
  try {
    return JSON.parse(sessionStorage.getItem(ideaDraftKey(participant)) || "{}");
  } catch {
    return {};
  }
}

function saveIdeaDraft(participant, form) {
  const draft = {
    titulo: fieldValue(form, "titulo"),
    area: fieldValue(form, "area"),
    descricao_local: fieldValue(form, "descricao_local"),
    problema_observado: fieldValue(form, "problema_observado"),
    sugestao_melhoria: fieldValue(form, "sugestao_melhoria"),
    senso: fieldValue(form, "senso")
  };
  sessionStorage.setItem(ideaDraftKey(participant), JSON.stringify(draft));
}

function clearIdeaDraft(participant) {
  sessionStorage.removeItem(ideaDraftKey(participant));
}

function restoreIdeaDraft(participant, form) {
  const draft = readIdeaDraft(participant);
  ["titulo", "area", "descricao_local", "problema_observado", "sugestao_melhoria", "senso"].forEach((field) => {
    if (draft[field] && form.elements[field]) {
      form.elements[field].value = draft[field];
    }
  });
}

export function showRegistrationForm({ onSuccess, onCancel } = {}) {
  const root = showOverlay(
    `
      <div class="modal-backdrop">
        <section class="modal-card participant-card" aria-labelledby="participant-title">
          <div class="modal-heading">
            <p class="eyebrow">Cadastro da missão</p>
            <h2 id="participant-title">Viu uma oportunidade de melhoria? Registre sua ideia!</h2>
            <p>Lance melhorias, descreva a oportunidade e suba no ranking.</p>
          </div>
          <form id="participant-form" class="stacked-form" autocomplete="off">
            <label>
              Nome completo
              <input name="nome" type="text" autocomplete="off" autocapitalize="words" required />
            </label>
            <label>
              Matrícula
              <input name="matricula" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" required />
            </label>
            <label>
              Turno
              <select name="turno" required>
                <option value="">Selecione</option>
                ${TURNOS.map((turno) => `<option value="${escapeHtml(turno)}">${escapeHtml(turno)}</option>`).join("")}
              </select>
            </label>
            <p id="participant-error" class="form-error" role="alert"></p>
            <div class="form-actions">
              ${onCancel ? '<button class="ghost-button" type="button" data-action="cancel">Cancelar</button>' : ""}
              <button class="primary-button" type="submit">Entrar na Missão</button>
            </div>
          </form>
        </section>
      </div>
    `
  );

  const form = root.querySelector("#participant-form");
  const error = root.querySelector("#participant-error");
  const cancel = root.querySelector('[data-action="cancel"]');

  cancel?.addEventListener("click", () => {
    hideOverlay();
    if (onCancel) onCancel();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.textContent = "";

    const validation = validateParticipant({
      nome: fieldValue(form, "nome"),
      matricula: fieldValue(form, "matricula"),
      turno: fieldValue(form, "turno")
    });

    if (!validation.valid) {
      error.textContent = validation.message;
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    setBusy(submitButton, true, "Entrando...");

    try {
      const participant = await registerParticipant(validation.participant);
      hideOverlay();
      showToast("Cadastro salvo para esta sessão.", "success");
      if (onSuccess) onSuccess(participant);
    } catch (err) {
      error.textContent = err.message || "Não foi possível salvar o cadastro.";
    } finally {
      setBusy(submitButton, false, "Entrar na Missão");
    }
  });
}

export function showIdeaForm({ participant, onSuccess, onCancel } = {}) {
  const root = showOverlay(
    `
      <div class="modal-backdrop">
        <section class="modal-card idea-card" aria-labelledby="idea-title">
          <div class="modal-heading">
            <p class="eyebrow">Nova melhoria 5S</p>
            <h2 id="idea-title">Registrar ideia bem descrita</h2>
          </div>
          <form id="idea-form" class="stacked-form" autocomplete="off">
            <label>
              Título da ideia
              <input name="titulo" type="text" autocomplete="off" placeholder="Ex: Instalar lixeira próxima à OP40" required />
            </label>
            <label>
              Área ou linha
              <input name="area" type="text" autocomplete="off" placeholder="Ex: UTE 2, PPCS, PPCD, PRS, OP40" required />
            </label>
            <label>
              Descrição detalhada do local
              <textarea name="descricao_local" rows="3" autocomplete="off" placeholder="Descreva exatamente onde está a oportunidade de melhoria." required></textarea>
            </label>
            <label>
              Problema observado
              <textarea name="problema_observado" rows="3" autocomplete="off" placeholder="Explique o problema ou desperdício observado." required></textarea>
            </label>
            <label>
              Sugestão de melhoria
              <textarea name="sugestao_melhoria" rows="3" autocomplete="off" placeholder="Descreva sua proposta para melhorar o local." required></textarea>
            </label>
            <label>
              Senso relacionado
              <select name="senso" required>
                <option value="">Selecione</option>
                ${SENSOS.map((senso) => `<option value="${escapeHtml(senso)}">${escapeHtml(senso)}</option>`).join("")}
              </select>
            </label>
            <p id="idea-error" class="form-error" role="alert"></p>
            <div class="form-actions">
              <button class="ghost-button" type="button" data-action="cancel">Cancelar</button>
              <button class="primary-button" type="submit">Enviar ideia</button>
            </div>
          </form>
        </section>
      </div>
    `
  );

  const form = root.querySelector("#idea-form");
  const error = root.querySelector("#idea-error");
  const cancel = root.querySelector('[data-action="cancel"]');
  const submitButton = form.querySelector('[type="submit"]');
  restoreIdeaDraft(participant, form);

  form.querySelectorAll("input, textarea, select").forEach((field) => {
    field.addEventListener("input", () => saveIdeaDraft(participant, form));
    field.addEventListener("change", () => saveIdeaDraft(participant, form));
  });

  cancel.addEventListener("click", () => {
    saveIdeaDraft(participant, form);
    hideOverlay();
    if (onCancel) onCancel();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.textContent = "";
    await audioManager.unlock();

    if (!isSupabaseConfigured()) {
      error.textContent = SUPABASE_CONFIG_MESSAGE;
      return;
    }

    const formData = {
      titulo: fieldValue(form, "titulo"),
      area: fieldValue(form, "area"),
      descricao_local: fieldValue(form, "descricao_local"),
      problema_observado: fieldValue(form, "problema_observado"),
      sugestao_melhoria: fieldValue(form, "sugestao_melhoria"),
      senso: fieldValue(form, "senso")
    };

    const validation = validateIdea(formData);
    if (!validation.valid) {
      error.textContent = validation.message;
      return;
    }

    cancel.disabled = true;
    setBusy(submitButton, true, "Enviando ideia...");

    try {
      const result = await submitIdea(participant, formData);
      clearIdeaDraft(participant);
      audioManager.playEffect("ideaSent");
      showIdeaSuccess(result, { onSuccess });
    } catch (err) {
      error.textContent = err.message || "Não foi possível enviar a ideia.";
      error.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } finally {
      cancel.disabled = false;
      setBusy(submitButton, false, "Enviar ideia");
    }
  });
}

function showIdeaSuccess(result, { onSuccess } = {}) {
  const top3Message = result.rankPosition && result.rankPosition <= 3
    ? `<p class="success-rank">Você entrou no Top 3 da missão.</p>`
    : `<p class="success-rank">Continue participando para subir no ranking.</p>`;

  showOverlay(
    `
      <div class="modal-backdrop">
        <section class="modal-card success-card" aria-labelledby="success-title">
          <div class="success-badge">+${formatNumber(result.pointsAdded)} pontos</div>
          <h2 id="success-title">Ideia enviada com sucesso!</h2>
          <p>Sua participação foi registrada no ranking.</p>
          ${top3Message}
          <div class="result-grid">
            <div>
              <strong>${formatNumber(result.participant.total_ideias)}</strong>
              <span>Total de ideias</span>
            </div>
            <div>
              <strong>${formatNumber(result.participant.total_pontos)}</strong>
              <span>Total de pontos</span>
            </div>
          </div>
          <div class="form-actions stacked-mobile">
            <button class="secondary-button" type="button" data-action="another">Enviar outra ideia</button>
            <button class="secondary-button" type="button" data-action="ranking">Ver ranking</button>
            <button class="primary-button" type="button" data-action="mission">Voltar para missão</button>
          </div>
        </section>
      </div>
    `
  );

  if (result.rankPosition && result.rankPosition <= 3) {
    audioManager.playEffect("top3");
  } else {
    audioManager.playEffect("keepGoing");
  }

  const root = document.getElementById("overlay-root");
  root.querySelector('[data-action="another"]').addEventListener("click", () => {
    hideOverlay();
    if (onSuccess) onSuccess(result, "another");
  });
  root.querySelector('[data-action="ranking"]').addEventListener("click", () => {
    hideOverlay();
    if (onSuccess) onSuccess(result, "ranking");
  });
  root.querySelector('[data-action="mission"]').addEventListener("click", () => {
    hideOverlay();
    if (onSuccess) onSuccess(result, "mission");
  });
}
