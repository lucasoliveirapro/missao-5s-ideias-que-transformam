import {
  db,
  get,
  getDownloadURL,
  isFirebaseConfigured,
  onValue,
  push,
  ref,
  set,
  storage,
  storageRef,
  update,
  uploadBytes
} from "../firebase.js";
import {
  POINTS,
  findParticipantPosition,
  makeSafeFileName,
  normalizeMatricula,
  nowIso,
  setStoredParticipant,
  sortParticipants
} from "../utils.js";

export const FIREBASE_CONFIG_MESSAGE =
  "Firebase ainda não configurado. O ranking online e o envio de ideias dependem da configuração.";

function withTimeout(promise, timeoutMs, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
}

function getStorageUploadErrorMessage(error) {
  const message = String(error?.message || "");
  const code = String(error?.code || "");

  if (code === "storage/unauthorized") {
    return "A foto foi escolhida, mas o Firebase Storage bloqueou o envio. Publique storage.rules permitindo imagens em ideas/{matricula}.";
  }

  if (code === "storage/quota-exceeded") {
    return "O Firebase Storage atingiu o limite de cota do projeto. Verifique o plano/uso no Firebase.";
  }

  if (code === "storage/retry-limit-exceeded" || message.includes("demorou")) {
    return "A foto foi escolhida, mas o envio demorou demais. Verifique a conexão e publique o cors.json no Firebase Storage.";
  }

  if (message.includes("CORS") || message.includes("cors") || code === "storage/unknown") {
    return "A foto foi escolhida, mas o bucket recusou o envio. Publique storage.rules e cors.json no Firebase Storage.";
  }

  return "Não foi possível enviar a foto. Verifique sua conexão e as regras do Firebase Storage.";
}

function snapshotToArray(snapshot) {
  const value = snapshot.val() || {};
  return Object.entries(value).map(([key, item]) => ({ ...item, id: item.id || key }));
}

export async function registerParticipant(participant) {
  const normalized = {
    ...participant,
    matricula: normalizeMatricula(participant.matricula)
  };

  setStoredParticipant(normalized);

  if (!isFirebaseConfigured()) {
    return { ...normalized, totalIdeias: 0, totalPontos: 0 };
  }

  const participantRef = ref(db, `participants/${normalized.matricula}`);
  const snapshot = await get(participantRef);
  const date = nowIso();

  if (snapshot.exists()) {
    const current = snapshot.val();
    const updatedParticipant = {
      ...current,
      nome: normalized.nome,
      matricula: normalized.matricula,
      turno: normalized.turno,
      ultimaParticipacao: current.ultimaParticipacao || date
    };
    await update(participantRef, {
      nome: normalized.nome,
      turno: normalized.turno,
      ultimaParticipacao: updatedParticipant.ultimaParticipacao
    });
    return updatedParticipant;
  }

  const created = {
    nome: normalized.nome,
    matricula: normalized.matricula,
    turno: normalized.turno,
    totalIdeias: 0,
    totalPontos: 0,
    ultimaParticipacao: date,
    criadoEm: date
  };

  await set(participantRef, created);
  return created;
}

export async function submitIdea(participant, formData) {
  if (!isFirebaseConfigured()) {
    throw new Error(FIREBASE_CONFIG_MESSAGE);
  }

  const matricula = normalizeMatricula(participant.matricula);
  const timestamp = Date.now();
  const safeFileName = makeSafeFileName(formData.foto.name);
  const fotoPath = `ideas/${matricula}/${timestamp}_${safeFileName}`;
  const fileRef = storageRef(storage, fotoPath);
  const metadata = { contentType: formData.foto.type || "image/jpeg" };

  let fotoUrl = "";
  try {
    await withTimeout(
      uploadBytes(fileRef, formData.foto, metadata),
      20000,
      "O envio da foto demorou demais. Verifique as regras/CORS do Firebase Storage e tente novamente."
    );
    fotoUrl = await withTimeout(
      getDownloadURL(fileRef),
      10000,
      "A foto foi enviada, mas não foi possível obter o link. Verifique as regras do Firebase Storage."
    );
  } catch (error) {
    throw new Error(getStorageUploadErrorMessage(error));
  }

  const ideasRef = ref(db, "ideas");
  const ideaRef = push(ideasRef);
  const date = nowIso();
  const initialPoints = POINTS.idea + POINTS.photo;

  const idea = {
    id: ideaRef.key,
    nome: participant.nome,
    matricula,
    turno: participant.turno,
    titulo: String(formData.titulo).trim(),
    descricao: String(formData.descricao).trim(),
    senso: formData.senso,
    area: String(formData.area).trim(),
    fotoUrl,
    fotoPath,
    status: "Recebida",
    pontos: initialPoints,
    bonusStatus: {
      aprovada: false,
      implantada: false
    },
    dataHora: date,
    atualizadoEm: date
  };

  const participantRef = ref(db, `participants/${matricula}`);
  const participantSnapshot = await get(participantRef);
  const currentParticipant = participantSnapshot.exists() ? participantSnapshot.val() : null;

  const updatedParticipant = {
    nome: participant.nome,
    matricula,
    turno: participant.turno,
    totalIdeias: Number(currentParticipant?.totalIdeias || 0) + 1,
    totalPontos: Number(currentParticipant?.totalPontos || 0) + initialPoints,
    ultimaParticipacao: date,
    criadoEm: currentParticipant?.criadoEm || date
  };

  await update(ref(db), {
    [`ideas/${ideaRef.key}`]: idea,
    [`participants/${matricula}`]: updatedParticipant
  });
  setStoredParticipant({ nome: participant.nome, matricula, turno: participant.turno });

  const participants = await getParticipantsOnce();
  const rankPosition = findParticipantPosition(participants, matricula);

  return {
    idea,
    participant: updatedParticipant,
    pointsAdded: initialPoints,
    rankPosition
  };
}

export async function getParticipantStats(matricula) {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const snapshot = await get(ref(db, `participants/${normalizeMatricula(matricula)}`));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function getParticipantsOnce() {
  if (!isFirebaseConfigured()) {
    return [];
  }

  const snapshot = await get(ref(db, "participants"));
  return sortParticipants(snapshotToArray(snapshot));
}

export function observeParticipants(callback, onError) {
  if (!isFirebaseConfigured()) {
    callback([]);
    return () => {};
  }

  return onValue(
    ref(db, "participants"),
    (snapshot) => callback(sortParticipants(snapshotToArray(snapshot))),
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function observeParticipant(matricula, callback, onError) {
  if (!isFirebaseConfigured()) {
    callback(null);
    return () => {};
  }

  return onValue(
    ref(db, `participants/${normalizeMatricula(matricula)}`),
    (snapshot) => callback(snapshot.exists() ? snapshot.val() : null),
    (error) => {
      if (onError) onError(error);
    }
  );
}
