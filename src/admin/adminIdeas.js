import {
  db,
  deleteObject,
  get,
  isFirebaseConfigured,
  onValue,
  ref,
  remove,
  storage,
  storageRef,
  update
} from "../firebase.js";
import { IDEA_STATUSES, POINTS, nowIso, sortParticipants } from "../utils.js";

function snapshotToArray(snapshot) {
  const value = snapshot.val() || {};
  return Object.entries(value).map(([key, item]) => ({ ...item, id: item.id || key }));
}

export function listenAdminData(callback, onError) {
  if (!isFirebaseConfigured()) {
    callback({ ideas: [], participants: [] });
    return () => {};
  }

  let ideas = [];
  let participants = [];

  const emit = () => callback({ ideas, participants: sortParticipants(participants) });

  const unsubscribeIdeas = onValue(
    ref(db, "ideas"),
    (snapshot) => {
      ideas = snapshotToArray(snapshot).sort((a, b) => Date.parse(b.dataHora || "") - Date.parse(a.dataHora || ""));
      emit();
    },
    onError
  );

  const unsubscribeParticipants = onValue(
    ref(db, "participants"),
    (snapshot) => {
      participants = snapshotToArray(snapshot);
      emit();
    },
    onError
  );

  return () => {
    unsubscribeIdeas();
    unsubscribeParticipants();
  };
}

export async function changeIdeaStatus(ideaId, nextStatus) {
  if (!IDEA_STATUSES.includes(nextStatus)) {
    throw new Error("Status inválido.");
  }

  const ideaRef = ref(db, `ideas/${ideaId}`);
  const ideaSnapshot = await get(ideaRef);
  if (!ideaSnapshot.exists()) {
    throw new Error("Ideia não encontrada.");
  }

  const idea = ideaSnapshot.val();
  const matricula = idea.matricula;
  const participantRef = ref(db, `participants/${matricula}`);
  const participantSnapshot = await get(participantRef);
  const participant = participantSnapshot.exists() ? participantSnapshot.val() : null;
  const date = nowIso();
  const rootUpdates = {
    [`ideas/${ideaId}/status`]: nextStatus,
    [`ideas/${ideaId}/atualizadoEm`]: date
  };

  let bonus = 0;
  const bonusStatus = {
    aprovada: Boolean(idea.bonusStatus?.aprovada),
    implantada: Boolean(idea.bonusStatus?.implantada)
  };

  if (nextStatus === "Aprovada" && !bonusStatus.aprovada) {
    bonus += POINTS.approved;
    bonusStatus.aprovada = true;
  }

  if (nextStatus === "Implantada" && !bonusStatus.implantada) {
    bonus += POINTS.implemented;
    bonusStatus.implantada = true;
  }

  rootUpdates[`ideas/${ideaId}/bonusStatus`] = bonusStatus;

  if (bonus > 0) {
    rootUpdates[`ideas/${ideaId}/pontos`] = Number(idea.pontos || 0) + bonus;

    if (participant) {
      rootUpdates[`participants/${matricula}/totalPontos`] = Number(participant.totalPontos || 0) + bonus;
      rootUpdates[`participants/${matricula}/ultimaParticipacao`] = participant.ultimaParticipacao || date;
    } else {
      rootUpdates[`participants/${matricula}`] = {
        nome: idea.nome,
        matricula,
        turno: idea.turno,
        totalIdeias: 1,
        totalPontos: Number(idea.pontos || 0) + bonus,
        ultimaParticipacao: idea.dataHora || date,
        criadoEm: idea.dataHora || date
      };
    }
  }

  await update(ref(db), rootUpdates);
  return { bonus };
}

export async function clearEventData(ideas) {
  const photos = ideas.filter((idea) => idea.fotoPath).map((idea) => idea.fotoPath);
  const photoResults = [];

  if (storage && photos.length) {
    for (const fotoPath of photos) {
      try {
        await deleteObject(storageRef(storage, fotoPath));
        photoResults.push({ fotoPath, ok: true });
      } catch (error) {
        photoResults.push({ fotoPath, ok: false, message: error.message });
      }
    }
  }

  await remove(ref(db, "participants"));
  await remove(ref(db, "ideas"));

  return {
    photosAttempted: photos.length,
    photosDeleted: photoResults.filter((item) => item.ok).length,
    photosFailed: photoResults.filter((item) => !item.ok).length
  };
}
