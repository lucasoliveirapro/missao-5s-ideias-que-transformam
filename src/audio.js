import { getAssetPath } from "./utils.js";

const TRACKS = {
  background: "audio/musica-fundo.mp3",
  ideaSent: "audio/ideia-enviada.mp3",
  ranking: "audio/ranking.mp3",
  top3: "audio/top3.mp3",
  keepGoing: "audio/continue-participando.mp3",
  goal: "audio/gol-de-ideia.mp3",
  crowd: "audio/torcida.mp3",
  whistle: "audio/apito.mp3"
};

const TRACK_CHECK_TIMEOUT_MS = 4000;

function parseContentLength(headers) {
  const directLength = Number(headers.get("content-length") || 0);
  if (directLength > 0) {
    return directLength;
  }

  const range = headers.get("content-range") || "";
  const total = Number(range.split("/").pop() || 0);
  return Number.isFinite(total) ? total : 0;
}

function hasAudioContentType(headers) {
  const contentType = String(headers.get("content-type") || "").toLowerCase();
  return !contentType || contentType.startsWith("audio/") || contentType.includes("mpeg");
}

async function requestWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), TRACK_CHECK_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      cache: "no-store",
      signal: controller.signal
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

class AudioManager {
  constructor() {
    this.enabled = true;
    this.volume = 0.28;
    this.unlocked = false;
    this.backgroundKey = null;
    this.instances = new Map();
    this.trackStatus = new Map();
    this.statusElement = null;
  }

  setStatusElement(element) {
    this.statusElement = element;
    this.updateStatus("");
  }

  updateStatus(message) {
    if (this.statusElement) {
      this.statusElement.textContent = message;
    }
  }

  async checkTrack(key) {
    if (!TRACKS[key]) {
      return { available: false, reason: "missing-key" };
    }

    if (this.trackStatus.has(key)) {
      return this.trackStatus.get(key);
    }

    const url = getAssetPath(TRACKS[key]);
    let status = { available: false, reason: "unavailable", url };

    try {
      let response = await requestWithTimeout(url, { method: "HEAD" });

      if (!response.ok || parseContentLength(response.headers) <= 0) {
        response = await requestWithTimeout(url, {
          method: "GET",
          headers: { Range: "bytes=0-0" }
        });
      }

      const length = parseContentLength(response.headers);
      const validType = hasAudioContentType(response.headers);
      status = {
        available: response.ok && length > 0 && validType,
        reason: response.ok ? "empty-or-invalid" : "not-found",
        url
      };
    } catch {
      status = { available: false, reason: "network", url };
    }

    this.trackStatus.set(key, status);
    return status;
  }

  async getAudio(key) {
    const status = await this.checkTrack(key);
    if (!status.available) {
      this.updateStatus("Audio nao adicionado");
      return null;
    }

    if (!this.instances.has(key)) {
      const audio = new Audio(status.url);
      audio.preload = "auto";
      audio.volume = this.volume;
      audio.addEventListener("error", () => {
        this.trackStatus.set(key, { ...status, available: false, reason: "decode-error" });
        this.instances.delete(key);
        this.updateStatus("Audio invalido");
      });
      this.instances.set(key, audio);
    }

    this.updateStatus("");
    return this.instances.get(key);
  }

  async unlock() {
    if (this.unlocked) {
      return;
    }

    this.unlocked = true;
    if (this.backgroundKey) {
      await this.playBackground(this.backgroundKey);
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAll();
      this.updateStatus("");
      return;
    }

    if (this.backgroundKey) {
      this.playBackground(this.backgroundKey);
    }
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, Number(value)));
    this.instances.forEach((audio) => {
      audio.volume = this.volume;
    });
  }

  async playBackground(key = "background") {
    this.backgroundKey = key;
    if (!this.enabled || !this.unlocked) {
      return;
    }

    const audio = await this.getAudio(key);
    if (!audio) {
      return;
    }

    audio.loop = true;
    audio.volume = this.volume;

    try {
      await audio.play();
    } catch {
      this.unlocked = false;
    }
  }

  async stopBackground() {
    if (!this.backgroundKey) {
      return;
    }

    const audio = await this.getAudio(this.backgroundKey);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    this.backgroundKey = null;
  }

  async playEffect(key) {
    if (!this.enabled || !this.unlocked) {
      return;
    }

    const source = await this.getAudio(key);
    if (!source) {
      return;
    }

    try {
      const effect = source.cloneNode(true);
      effect.volume = this.volume;
      await effect.play();
    } catch {
      // Missing or invalid audio must never interrupt the mission flow.
    }
  }

  stopAll() {
    this.instances.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }
}

export const audioManager = new AudioManager();

export function setupAudioControls() {
  const root = document.getElementById("sound-controls");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <button id="toggle-sound" type="button" aria-pressed="true">Som Ligado</button>
    <label>
      Volume
      <input id="volume-control" type="range" min="0" max="1" step="0.05" value="0.28" />
    </label>
    <span id="sound-status" class="sound-status" aria-live="polite"></span>
  `;

  const toggle = root.querySelector("#toggle-sound");
  const volume = root.querySelector("#volume-control");
  const status = root.querySelector("#sound-status");
  audioManager.setStatusElement(status);

  toggle.addEventListener("click", async () => {
    await audioManager.unlock();
    const enabled = toggle.getAttribute("aria-pressed") !== "true";
    toggle.setAttribute("aria-pressed", String(enabled));
    toggle.textContent = enabled ? "Som Ligado" : "Som Desligado";
    audioManager.setEnabled(enabled);
  });

  volume.addEventListener("input", (event) => {
    audioManager.setVolume(event.target.value);
  });

  window.addEventListener(
    "pointerdown",
    () => {
      audioManager.unlock();
    },
    { once: true }
  );
}
