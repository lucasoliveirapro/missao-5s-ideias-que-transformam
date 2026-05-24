"use strict";

// ==================================================
// Firebase
// ==================================================
// Cole aqui as credenciais do seu projeto Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyB9lnc5c2_pusV_I8wDhxqkER87-Y10JYc",
  authDomain: "missao-5s.firebaseapp.com",
  databaseURL: "https://missao-5s-default-rtdb.firebaseio.com",
  projectId: "missao-5s",
  storageBucket: "missao-5s.firebasestorage.app",
  messagingSenderId: "77611909008",
  appId: "1:77611909008:web:cc87fbbe2a76d0a6e5c32d",
  measurementId: "G-3TK8S594J",
};

let database = null;
let firebaseReady = false;

function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.databaseURL &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
  );
}

function initFirebase() {
  if (!hasFirebaseConfig()) {
    setFirebaseNotice(
      "Firebase não configurado. O jogo funciona em modo local neste dispositivo; o ranking online depende do firebaseConfig.",
    );
    return;
  }

  if (!window.firebase) {
    setFirebaseNotice(
      "Firebase SDK não carregou. Verifique sua conexão com a internet.",
    );
    return;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    firebaseReady = true;
    setFirebaseNotice("");
  } catch (error) {
    console.error("Erro ao iniciar Firebase:", error);
    setFirebaseNotice(
      "Não foi possível iniciar o Firebase. Confira as credenciais.",
    );
  }
}

function setFirebaseNotice(message) {
  const notice = document.getElementById("firebase-notice");
  if (!notice) return;
  notice.textContent = message;
  notice.className = message ? "status-message error" : "status-message";
}

// ==================================================
// Perguntas
// ==================================================
const senses = [
  { code: "SEIRI", label: "Utilização", description: "Senso de Utilização" },
  { code: "SEITON", label: "Organização", description: "Senso de Organização" },
  { code: "SEISOU", label: "Limpeza", description: "Senso de Limpeza" },
  { code: "SEIKETSU", label: "Saúde", description: "Senso de Saúde" },
  { code: "SHITSUKE", label: "Disciplina", description: "Senso de Disciplina" },
];

const questions = [
  {
    situation:
      "Na bancada existem peças antigas, materiais sem uso e ferramentas que não pertencem à atividade atual.",
    correct: "SEIRI",
    explanation:
      "O SEIRI elimina o que não é necessário para liberar espaço e reduzir desperdícios.",
  },
  {
    situation:
      "Há caixas vazias e dispositivos obsoletos ocupando espaço na área produtiva.",
    correct: "SEIRI",
    explanation: "O SEIRI ajuda a separar o necessário do desnecessário.",
  },
  {
    situation:
      "Materiais que não são utilizados na operação estão misturados com itens necessários.",
    correct: "SEIRI",
    explanation:
      "O SEIRI evita excesso de itens e facilita a rotina da operação.",
  },
  {
    situation: "Uma ferramenta foi usada e ficou fora do local identificado.",
    correct: "SEITON",
    explanation:
      "O SEITON garante que cada item tenha local definido e identificado.",
  },
  {
    situation:
      "Os materiais estão corretos, mas não possuem identificação visual.",
    correct: "SEITON",
    explanation:
      "O SEITON organiza e identifica os itens para facilitar o uso.",
  },
  {
    situation:
      "A bancada possui itens necessários, porém estão espalhados e sem padrão de posição.",
    correct: "SEITON",
    explanation: "O SEITON define lugar certo para cada coisa.",
  },
  {
    situation:
      "Existe acúmulo de sujeira, pó metálico e resíduos próximos ao equipamento.",
    correct: "SEISOU",
    explanation:
      "O SEISOU trata da limpeza e da identificação das fontes de sujeira.",
  },
  {
    situation: "O chão da área apresenta sujeira e restos de material.",
    correct: "SEISOU",
    explanation: "O SEISOU mantém o ambiente limpo e seguro.",
  },
  {
    situation:
      "Há cola, poeira ou cavacos acumulados em pontos de difícil acesso.",
    correct: "SEISOU",
    explanation: "O SEISOU reforça a limpeza dos pontos críticos.",
  },
  {
    situation:
      "Um colaborador inicia uma atividade sem verificar os EPIs necessários no ciclo.",
    correct: "SEIKETSU",
    explanation:
      "O SEIKETSU reforça saúde, segurança e manutenção das condições adequadas.",
  },
  {
    situation:
      "A área possui uma condição que pode gerar risco ergonômico ou insegurança.",
    correct: "SEIKETSU",
    explanation: "O SEIKETSU ajuda a manter condições saudáveis e seguras.",
  },
  {
    situation: "Existe risco de tropeço por passagem parcialmente obstruída.",
    correct: "SEIKETSU",
    explanation:
      "O SEIKETSU está ligado à saúde, segurança e padronização das condições.",
  },
  {
    situation:
      "Existe um padrão definido, mas ele não está sendo seguido diariamente.",
    correct: "SHITSUKE",
    explanation:
      "O SHITSUKE é a disciplina para manter o padrão todos os dias.",
  },
  {
    situation:
      "A equipe organizou a área no evento, mas não mantém o padrão na rotina.",
    correct: "SHITSUKE",
    explanation: "O SHITSUKE transforma o 5S em hábito diário.",
  },
  {
    situation:
      "O checklist de 5S existe, mas não está sendo preenchido com frequência.",
    correct: "SHITSUKE",
    explanation:
      "O SHITSUKE reforça a disciplina de seguir o que foi combinado.",
  },
  {
    situation:
      "Uma peça sem uso ficou guardada por muito tempo embaixo da bancada.",
    correct: "SEIRI",
    explanation: "O SEIRI remove itens desnecessários do posto de trabalho.",
  },
  {
    situation:
      "As ferramentas estão no local correto, mas sem contorno, etiqueta ou identificação.",
    correct: "SEITON",
    explanation: "O SEITON facilita encontrar, usar e devolver cada item.",
  },
  {
    situation:
      "Durante a limpeza, foi encontrado vazamento pequeno próximo ao equipamento.",
    correct: "SEISOU",
    explanation: "No SEISOU, limpar também ajuda a enxergar anomalias.",
  },
  {
    situation:
      "Um colaborador está usando EPI, mas não o EPI correto para a atividade.",
    correct: "SEIKETSU",
    explanation:
      "O SEIKETSU reforça o cuidado com a saúde e a segurança no padrão da atividade.",
  },
  {
    situation:
      "O padrão foi treinado, mas algumas pessoas voltaram ao jeito antigo de trabalhar.",
    correct: "SHITSUKE",
    explanation:
      "O SHITSUKE mantém a disciplina para não perder o padrão conquistado.",
  },
  {
    situation:
      "Há documentos antigos e sem validade ocupando espaço no painel da área.",
    correct: "SEIRI",
    explanation:
      "O SEIRI elimina informações e materiais que não agregam mais à rotina.",
  },
  {
    situation:
      "Os itens de limpeza existem, mas ficam cada dia em um lugar diferente.",
    correct: "SEITON",
    explanation:
      "O SEITON define local fixo para facilitar o acesso e a reposição.",
  },
  {
    situation:
      "A máquina está operando, mas a região possui acúmulo de pó e sujeira.",
    correct: "SEISOU",
    explanation:
      "O SEISOU mantém a limpeza como parte da conservação do equipamento.",
  },
  {
    situation:
      "O colaborador precisa se abaixar de forma inadequada porque o material está mal posicionado.",
    correct: "SEIKETSU",
    explanation:
      "O SEIKETSU observa saúde, ergonomia e condições adequadas de trabalho.",
  },
  {
    situation:
      "A área foi demarcada, mas os materiais continuam sendo deixados fora da marcação.",
    correct: "SHITSUKE",
    explanation:
      "O SHITSUKE garante que o padrão visual seja respeitado todos os dias.",
  },
  {
    situation:
      "Existem parafusos, presilhas e itens misturados sem necessidade na bancada.",
    correct: "SEIRI",
    explanation: "O SEIRI separa o necessário do desnecessário.",
  },
  {
    situation: "A gaveta de ferramentas não possui padrão de organização.",
    correct: "SEITON",
    explanation: "O SEITON melhora a organização e reduz tempo de procura.",
  },
  {
    situation:
      "Durante a inspeção, foi identificada sujeira acumulada em uma proteção de difícil acesso.",
    correct: "SEISOU",
    explanation: "O SEISOU alcança pontos críticos e evita deterioração.",
  },
  {
    situation:
      "O ciclo indica o uso de óculos de proteção, mas a atividade foi iniciada sem conferência do EPI.",
    correct: "SEIKETSU",
    explanation:
      "O SEIKETSU ajuda a manter a saúde e segurança conforme o padrão.",
  },
  {
    situation:
      "Mesmo após orientação, a equipe não mantém a rotina de devolver os itens ao local correto.",
    correct: "SHITSUKE",
    explanation: "O SHITSUKE é a disciplina para sustentar o 5S no dia a dia.",
  },
];

// ==================================================
// Estado do jogo
// ==================================================
const ROUND_LIMIT = 10;
const QUESTION_TIME = 15;
const QUICK_BONUS_LIMIT_SECONDS = 5;
const PLAYER_STORAGE_KEY = "missao5s_player";
const LOCAL_PARTICIPANTS_KEY = "missao5s_local_participants";
const LOCAL_ATTEMPTS_KEY = "missao5s_local_attempts";

const state = {
  player: null,
  selectedQuestions: [],
  roundIndex: 0,
  score: 0,
  timeLeft: QUESTION_TIME,
  timerId: null,
  questionStartedAt: null,
  answered: false,
  ranking: [],
  lastSavedParticipant: null,
};

// ==================================================
// Áudio
// ==================================================
const audioFiles = {
  background: "musica-fundo.mp3",
  start: "inicio-missao.mp3",
  correct: ["voce-acertou.mp3", "muito-bem.mp3"],
  quick: "resposta-rapida.mp3",
  wrong: "voce-errou.mp3",
  timeout: "tempo-esgotado.mp3",
  newRound: ["nova-rodada.mp3", "olhar-critico.mp3"],
  end: "fim-partida.mp3",
  rankUp: "subiu-ranking.mp3",
  top3: "top3.mp3",
  playAgain: "jogar-novamente.mp3",
  standard: "padrao-5s.mp3",
  bodyshop: "funilaria-em-ordem.mp3",
  keepPracticing: "continue-praticando.mp3",
};

const audioState = {
  enabled: true,
  initialized: false,
  volume: 0.7,
  backgroundVolume: 0.25,
  background: null,
  cache: {},
};

function initAudio() {
  if (audioState.initialized) return;
  audioState.initialized = true;
  audioState.background = createAudio(
    audioFiles.background,
    true,
    audioState.backgroundVolume,
  );
}

function createAudio(fileName, loop = false, volume = audioState.volume) {
  const audio = new Audio(`assets/audio/${fileName}`);
  audio.loop = loop;
  audio.preload = "auto";
  audio.volume = volume;
  audio.addEventListener("error", () => {
    audio.dataset.unavailable = "true";
  });
  return audio;
}

function playBackgroundMusic() {
  if (!audioState.enabled) return;
  initAudio();
  if (
    !audioState.background ||
    audioState.background.dataset.unavailable === "true"
  )
    return;
  audioState.background.volume = audioState.backgroundVolume;
  audioState.background.play().catch(() => {});
}

function pauseBackgroundMusic() {
  if (audioState.background) {
    audioState.background.pause();
  }
}

function stopBackgroundMusic() {
  if (audioState.background) {
    audioState.background.pause();
    audioState.background.currentTime = 0;
  }
}

function pickAudioName(name) {
  const entry = audioFiles[name] || name;
  if (Array.isArray(entry)) {
    return entry[Math.floor(Math.random() * entry.length)];
  }
  return entry;
}

function playAudio(name) {
  if (!audioState.enabled) return;
  initAudio();
  const fileName = pickAudioName(name);
  if (!fileName) return;

  if (!audioState.cache[fileName]) {
    audioState.cache[fileName] = createAudio(
      fileName,
      false,
      audioState.volume,
    );
  }

  const audio = audioState.cache[fileName];
  if (audio.dataset.unavailable === "true") return;
  audio.currentTime = 0;
  audio.volume = audioState.volume;
  audio.play().catch(() => {});
}

function playCorrectSound(isQuick) {
  playAudio("correct");
  if (isQuick) {
    setTimeout(() => playAudio("quick"), 360);
  }
}

function playWrongSound() {
  playAudio("wrong");
}

function playTimeoutSound() {
  playAudio("timeout");
}

function playEndGameSound() {
  playAudio("end");
}

function playTop3Sound() {
  playAudio("top3");
}

function toggleSound() {
  audioState.enabled = !audioState.enabled;
  const button = document.getElementById("sound-toggle");
  button.textContent = audioState.enabled ? "Som: Ligado" : "Som: Desligado";
  if (audioState.enabled) {
    playBackgroundMusic();
  } else {
    pauseBackgroundMusic();
  }
}

function setVolume(value) {
  audioState.volume = Number(value) / 100;
  audioState.backgroundVolume = Math.min(audioState.volume, 0.25);
  if (audioState.background) {
    audioState.background.volume = audioState.backgroundVolume;
  }
}

// ==================================================
// Validação de formulário
// ==================================================
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

function normalizePlayer(player) {
  return {
    nome: normalizeName(player?.nome || ""),
    turno: String(player?.turno || "").trim(),
    matricula: normalizeRegistration(player?.matricula || ""),
  };
}

function validatePlayerForm() {
  const nameInput = document.getElementById("player-name");
  const shiftInput = document.getElementById("player-shift");
  const idInput = document.getElementById("player-id");
  const name = normalizeName(nameInput.value);
  const turno = shiftInput.value;
  const matricula = normalizeRegistration(idInput.value);
  let valid = true;

  setText("name-error", "");
  setText("shift-error", "");
  setText("id-error", "");
  setFormMessage("", "");

  if (!name || name.split(" ").filter(Boolean).length < 2) {
    setText("name-error", "Informe seu nome completo.");
    valid = false;
  }

  if (!turno) {
    setText("shift-error", "Selecione o turno.");
    valid = false;
  }

  if (!matricula || !isValidRegistration(matricula)) {
    setText("id-error", "A matrícula deve conter apenas números.");
    valid = false;
  }

  if (!valid) {
    setFormMessage(
      "Preencha todos os campos corretamente para iniciar.",
      "error",
    );
    return null;
  }

  nameInput.value = name;
  idInput.value = matricula;
  return normalizePlayer({ nome: name, turno, matricula });
}

function setFormMessage(message, type) {
  const element = document.getElementById("form-message");
  element.textContent = message;
  element.className = type ? `form-message ${type}` : "form-message";
}

function savePlayerToSession(player) {
  sessionStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(normalizePlayer(player)));
}

function loadPlayerFromSession() {
  try {
    const saved = sessionStorage.getItem(PLAYER_STORAGE_KEY);
    if (!saved) return null;
    return normalizePlayer(JSON.parse(saved));
  } catch (error) {
    return null;
  }
}

function fillPlayerForm(player) {
  if (!player) return;
  const normalized = normalizePlayer(player);
  document.getElementById("player-name").value = normalized.nome || "";
  document.getElementById("player-shift").value = normalized.turno || "";
  document.getElementById("player-id").value = normalized.matricula || "";
}

// ==================================================
// Controle das telas
// ==================================================
function showScreen(name) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("active", screen.id === `screen-${name}`);
  });

  if (name === "ranking") {
    renderRanking();
    if (state.ranking.length > 0) {
      playAudio("standard");
    }
  }

  if (name !== "game") {
    clearRoundTimer();
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderSenseList() {
  const container = document.getElementById("sense-list");
  container.innerHTML = senses
    .map(
      (sense) => `
    <div class="sense-item">
      <strong>${sense.code}</strong>
      <span>${sense.description}</span>
    </div>
  `,
    )
    .join("");
}

function renderAnswerButtons() {
  const container = document.getElementById("answers-grid");
  container.innerHTML = senses
    .map(
      (sense) => `
    <button class="answer-button" type="button" data-answer="${sense.code}">
      ${sense.code}
      <span>${sense.label}</span>
    </button>
  `,
    )
    .join("");

  container.querySelectorAll(".answer-button").forEach((button) => {
    button.addEventListener("click", () => handleAnswer(button.dataset.answer));
  });
}

// ==================================================
// Controle das rodadas
// ==================================================
function startGame() {
  initAudio();
  playBackgroundMusic();
  playAudio("start");

  state.selectedQuestions = shuffleArray(questions).slice(0, ROUND_LIMIT);
  state.roundIndex = 0;
  state.score = 0;
  state.timeLeft = QUESTION_TIME;
  state.answered = false;
  state.lastSavedParticipant = null;

  setText("current-score", "0");
  showScreen("game");
  startRound();
}

function startRound() {
  clearRoundTimer();
  state.answered = false;
  state.timeLeft = QUESTION_TIME;
  state.questionStartedAt = Date.now();

  const question = getCurrentQuestion();
  setText("round-label", `Rodada ${state.roundIndex + 1} de ${ROUND_LIMIT}`);
  setText("situation-text", question.situation);
  setText("timer-display", String(QUESTION_TIME));
  document
    .getElementById("timer-display")
    .parentElement.classList.remove("warning");
  document.getElementById("progress-fill").style.width =
    `${(state.roundIndex / ROUND_LIMIT) * 100}%`;
  resetFeedback();
  renderAnswerButtons();

  if (state.roundIndex > 0 && state.roundIndex % 2 === 0) {
    playAudio("newRound");
  }

  state.timerId = setInterval(() => {
    state.timeLeft -= 1;
    setText("timer-display", String(state.timeLeft));
    document
      .getElementById("timer-display")
      .parentElement.classList.toggle("warning", state.timeLeft <= 5);

    if (state.timeLeft <= 0) {
      handleTimeout();
    }
  }, 1000);
}

function getCurrentQuestion() {
  return state.selectedQuestions[state.roundIndex];
}

function clearRoundTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function handleAnswer(answer) {
  if (state.answered) return;

  state.answered = true;
  clearRoundTimer();

  const question = getCurrentQuestion();
  const isCorrect = answer === question.correct;
  const elapsedSeconds = (Date.now() - state.questionStartedAt) / 1000;
  const isQuick = isCorrect && elapsedSeconds <= QUICK_BONUS_LIMIT_SECONDS;
  const points = isCorrect ? 10 + (isQuick ? 5 : 0) : 0;

  state.score += points;
  setText("current-score", String(state.score));
  lockAnswerButtons(answer, question.correct);

  if (isCorrect) {
    playCorrectSound(isQuick);
    showFeedback(
      "correct",
      "✅ Correto!",
      isQuick ? "⚡ Resposta rápida! +5 pontos bônus" : "+10 pontos",
      question.explanation,
    );
  } else {
    playWrongSound();
    showFeedback(
      "wrong",
      "❌ Você errou.",
      `Resposta correta: ${question.correct}`,
      question.explanation,
    );
  }

  scheduleNextRound();
}

function handleTimeout() {
  if (state.answered) return;
  state.answered = true;
  clearRoundTimer();

  const question = getCurrentQuestion();
  lockAnswerButtons(null, question.correct);
  playTimeoutSound();
  showFeedback(
    "timeout",
    "⏱️ Tempo esgotado!",
    `Resposta correta: ${question.correct}`,
    question.explanation,
  );
  scheduleNextRound();
}

function lockAnswerButtons(selected, correct) {
  document.querySelectorAll(".answer-button").forEach((button) => {
    const answer = button.dataset.answer;
    button.disabled = true;
    if (answer === correct) button.classList.add("correct");
    if (selected && answer === selected && selected !== correct)
      button.classList.add("wrong");
  });
}

function resetFeedback() {
  const panel = document.getElementById("feedback-panel");
  panel.className = "feedback-panel";
  setText("feedback-title", "");
  setText("feedback-detail", "");
  setText("feedback-explanation", "");
}

function showFeedback(type, title, detail, explanation) {
  const panel = document.getElementById("feedback-panel");
  panel.className = `feedback-panel show ${type}`;
  setText("feedback-title", title);
  setText("feedback-detail", detail);
  setText("feedback-explanation", explanation);
}

function scheduleNextRound() {
  document.getElementById("progress-fill").style.width =
    `${((state.roundIndex + 1) / ROUND_LIMIT) * 100}%`;
  setTimeout(() => {
    state.roundIndex += 1;
    if (state.roundIndex >= ROUND_LIMIT) {
      finishGame();
    } else {
      startRound();
    }
  }, 2600);
}

async function finishGame() {
  clearRoundTimer();
  stopBackgroundMusic();
  playEndGameSound();
  showScreen("result");
  renderResultBase();

  try {
    const saved = await saveAttemptAndParticipant();
    state.lastSavedParticipant = saved.participant;
    mergeParticipantIntoRanking(saved.participant);
    updateResultWithSavedData(saved.participant);
    setSaveStatus("Pontuação salva com sucesso.", "success");
    renderRanking();

    const position = getParticipantPosition(saved.participant.matricula);
    if (position <= 3 && position > 0) {
      playTop3Sound();
    } else if (position > 0) {
      playAudio("rankUp");
    }
  } catch (error) {
    console.error("Erro ao salvar pontuação:", error);
    setSaveStatus(
      "Não foi possível salvar sua pontuação agora. Verifique a conexão e tente novamente.",
      "error",
    );
  }
}

// ==================================================
// Pontuação e salvamento
// ==================================================
async function saveAttemptAndParticipant() {
  if (!state.player) {
    throw new Error("Participante não informado.");
  }

  const player = normalizePlayer(state.player);
  if (!isValidRegistration(player.matricula)) {
    throw new Error("Matrícula inválida.");
  }

  state.player = player;
  savePlayerToSession(player);

  const now = new Date().toISOString();
  const baseAttempt = {
    nome: player.nome,
    matricula: player.matricula,
    turno: player.turno,
    pontosPartida: state.score,
    pontosAcumuladosAposPartida: 0,
    partidasAposPartida: 0,
    melhorPartidaAposPartida: 0,
    dataHora: now,
    finalizada: false,
  };

  if (firebaseReady) {
    return saveWithFirebase(baseAttempt, now, player);
  }

  return saveLocally(baseAttempt, now, player);
}

async function saveWithFirebase(baseAttempt, now, player) {
  const participantKey = player.matricula;
  const attemptRef = database.ref("attempts").push();
  await attemptRef.set(baseAttempt);

  // A matrícula normalizada é a única chave do participante no ranking.
  const participantRef = database.ref("participants").child(participantKey);
  const transactionResult = await participantRef.transaction((current) => {
    const previousTotal = Number(current?.totalPontos || 0);
    const nextTotal = previousTotal + state.score;
    const previousBest = Number(current?.melhorPartida || 0);
    const previousGames = Number(current?.partidas || 0);

    return {
      nome: player.nome,
      matricula: participantKey,
      turno: player.turno,
      totalPontos: nextTotal,
      partidas: previousGames + 1,
      melhorPartida: Math.max(previousBest, state.score),
      ultimaParticipacao: now,
      criadoEm: current?.criadoEm || now,
      atingiuPontuacaoAtualEm:
        nextTotal > previousTotal
          ? now
          : current?.atingiuPontuacaoAtualEm || now,
    };
  });

  if (!transactionResult.committed) {
    throw new Error("Atualização do participante não confirmada.");
  }

  const participant = transactionResult.snapshot.val();
  await attemptRef.update({
    pontosAcumuladosAposPartida: participant.totalPontos,
    partidasAposPartida: participant.partidas,
    melhorPartidaAposPartida: participant.melhorPartida,
    finalizada: true,
  });

  return { participant, attemptId: attemptRef.key };
}

async function saveLocally(baseAttempt, now, player) {
  const participantKey = player.matricula;
  const participants = getLocalParticipants();
  const attempts = getLocalAttempts();
  const current = participants[participantKey] || {};
  const previousTotal = Number(current.totalPontos || 0);
  const nextTotal = previousTotal + state.score;
  const participant = {
    nome: player.nome,
    matricula: participantKey,
    turno: player.turno,
    totalPontos: nextTotal,
    partidas: Number(current.partidas || 0) + 1,
    melhorPartida: Math.max(Number(current.melhorPartida || 0), state.score),
    ultimaParticipacao: now,
    criadoEm: current.criadoEm || now,
    atingiuPontuacaoAtualEm:
      nextTotal > previousTotal ? now : current.atingiuPontuacaoAtualEm || now,
  };

  const attempt = {
    ...baseAttempt,
    pontosAcumuladosAposPartida: participant.totalPontos,
    partidasAposPartida: participant.partidas,
    melhorPartidaAposPartida: participant.melhorPartida,
    finalizada: true,
  };

  participants[participantKey] = participant;
  attempts[`local-${Date.now()}`] = attempt;
  localStorage.setItem(LOCAL_PARTICIPANTS_KEY, JSON.stringify(participants));
  localStorage.setItem(LOCAL_ATTEMPTS_KEY, JSON.stringify(attempts));
  state.ranking = sortRanking(participantsFromRecord(participants));
  return { participant, attemptId: null };
}

function getLocalParticipants() {
  return parseLocalJson(LOCAL_PARTICIPANTS_KEY);
}

function getLocalAttempts() {
  return parseLocalJson(LOCAL_ATTEMPTS_KEY);
}

function parseLocalJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch (error) {
    return {};
  }
}

function renderResultBase() {
  setText("result-name", state.player.nome);
  setText("result-id", state.player.matricula);
  setText("result-shift", state.player.turno);
  setText("result-score", String(state.score));
  setText("result-total", "Salvando...");
  setText("result-games", "Salvando...");
  setText("result-best", "Salvando...");
  setText("result-position", "Calculando...");
  setText(
    "result-message",
    `Parabéns, ${firstName(state.player.nome)}! Você fez ${state.score} pontos nesta rodada. Vamos atualizar sua pontuação acumulada no ranking do 5S.`,
  );
}

function updateResultWithSavedData(participant) {
  const position = getParticipantPosition(participant.matricula);
  setText("result-total", String(participant.totalPontos));
  setText("result-games", String(participant.partidas));
  setText("result-best", String(participant.melhorPartida));
  setText("result-position", position > 0 ? `${position}º` : "-");
  setText(
    "result-message",
    `Parabéns, ${firstName(participant.nome)}! Você fez ${state.score} pontos nesta rodada. Sua pontuação acumulada agora é ${participant.totalPontos} pontos. Continue participando para subir no ranking do 5S!`,
  );
}

function setSaveStatus(message, type) {
  const element = document.getElementById("save-status");
  element.textContent = message;
  element.className = type ? `status-message ${type}` : "status-message";
}

function firstName(name) {
  return String(name || "").split(" ")[0] || "participante";
}

// ==================================================
// Ranking
// ==================================================
function listenRanking() {
  if (!firebaseReady) {
    state.ranking = sortRanking(participantsFromRecord(getLocalParticipants()));
    renderRanking();
    return;
  }

  database.ref("participants").on(
    "value",
    (snapshot) => {
      const data = snapshot.val() || {};
      state.ranking = sortRanking(participantsFromRecord(data));
      renderRanking();
    },
    (error) => {
      console.error("Erro ao ouvir ranking:", error);
      setFirebaseNotice("Não foi possível carregar o ranking online agora.");
    },
  );
}

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
  if (!firebaseReady) {
    state.ranking = sortRanking(participantsFromRecord(getLocalParticipants()));
  }

  renderTop3();
  renderRankingTable();
  const totalGames = state.ranking.reduce(
    (sum, participant) => sum + Number(participant.partidas || 0),
    0,
  );
  setText("total-participants", String(state.ranking.length));
  setText("total-games", String(totalGames));
}

function mergeParticipantIntoRanking(participant) {
  const normalizedMatricula = normalizeRegistration(participant.matricula);
  const others = state.ranking.filter(
    (item) => normalizeRegistration(item.matricula) !== normalizedMatricula,
  );
  state.ranking = sortRanking([
    ...others,
    { ...participant, matricula: normalizedMatricula },
  ]);
}

function renderTop3() {
  const container = document.getElementById("top3-grid");
  const medals = ["🥇", "🥈", "🥉"];
  const empty = `
    <div class="top-card">
      <div class="medal">🏁</div>
      <h3>Ranking em formação</h3>
      <p>Finalize partidas para aparecer aqui.</p>
    </div>
  `;

  if (state.ranking.length === 0) {
    container.innerHTML = empty;
    return;
  }

  container.innerHTML = state.ranking
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
  const body = document.getElementById("ranking-table-body");
  const search = normalizeSearch(
    document.getElementById("ranking-search").value,
  );
  const shift = document.getElementById("ranking-shift-filter").value;

  const filtered = state.ranking.filter((participant) => {
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
        state.ranking.findIndex(
          (item) => item.matricula === participant.matricula,
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

function getParticipantPosition(matricula) {
  const normalizedMatricula = normalizeRegistration(matricula);
  const sorted = sortRanking(state.ranking);
  return (
    sorted.findIndex(
      (participant) => normalizeRegistration(participant.matricula) === normalizedMatricula,
    ) + 1
  );
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

// ==================================================
// Utilidades e eventos
// ==================================================
function shuffleArray(items) {
  return [...items]
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function bindEvents() {
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.nav;
      if (target === "home") {
        fillPlayerForm(loadPlayerFromSession());
      }
      showScreen(target);
    });
  });

  document.getElementById("player-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const player = validatePlayerForm();
    if (!player) return;
    state.player = player;
    savePlayerToSession(player);
    showScreen("instructions");
  });

  document.getElementById("player-id").addEventListener("change", (event) => {
    event.target.value = normalizeRegistration(event.target.value);
  });

  document
    .getElementById("start-game-button")
    .addEventListener("click", startGame);

  document.getElementById("play-again-button").addEventListener("click", () => {
    playAudio("playAgain");
    startGame();
  });

  document.getElementById("new-player-button").addEventListener("click", () => {
    sessionStorage.removeItem(PLAYER_STORAGE_KEY);
    state.player = null;
    document.getElementById("player-form").reset();
    setFormMessage("", "");
    showScreen("home");
  });

  document
    .getElementById("ranking-search")
    .addEventListener("input", renderRankingTable);
  document
    .getElementById("ranking-shift-filter")
    .addEventListener("change", renderRankingTable);
  document
    .getElementById("sound-toggle")
    .addEventListener("click", toggleSound);
  document
    .getElementById("volume-control")
    .addEventListener("input", (event) => setVolume(event.target.value));
}

function boot() {
  renderSenseList();
  bindEvents();
  const savedPlayer = loadPlayerFromSession();
  if (savedPlayer) {
    state.player = savedPlayer;
    fillPlayerForm(savedPlayer);
  }
  initFirebase();
  listenRanking();
}

document.addEventListener("DOMContentLoaded", boot);
