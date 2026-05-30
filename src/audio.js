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
const BACKGROUND_KEY = "background";

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
    this.backgroundKey = BACKGROUND_KEY;
    this.backgroundPlaying = false;
    this.instances = new Map();
    this.trackStatus = new Map();
    this.statusElement = null;
    this.toggleElement = null;
    this.fallbackContext = null;
    this.fallbackGain = null;
    this.fallbackNodes = [];
    this.usingFallbackBackground = false;
  }

  setStatusElement(element) {
    this.statusElement = element;
    this.updateStatus("");
  }

  setToggleElement(element) {
    this.toggleElement = element;
    this.updateToggle();
  }

  updateToggle() {
    if (!this.toggleElement) {
      return;
    }

    this.toggleElement.setAttribute("aria-pressed", String(this.enabled));
    this.toggleElement.textContent = this.enabled ? "Som Ligado" : "Som Desligado";
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

  getUnavailableMessage(key, status) {
    if (key !== BACKGROUND_KEY) {
      return "";
    }

    if (status?.reason === "empty-or-invalid" || status?.reason === "decode-error") {
      return "Arquivo de música inválido";
    }

    return "Adicione musica-fundo.mp3";
  }

  async getAudio(key, { silentMissing = false } = {}) {
    const status = await this.checkTrack(key);
    if (!status.available) {
      if (!silentMissing) {
        this.updateStatus(this.getUnavailableMessage(key, status));
      }
      return null;
    }

    if (!this.instances.has(key)) {
      const audio = new Audio(status.url);
      audio.preload = "auto";
      audio.volume = this.volume;
      audio.addEventListener("error", () => {
        this.trackStatus.set(key, { ...status, available: false, reason: "decode-error" });
        this.instances.delete(key);
        if (key === BACKGROUND_KEY) {
          this.updateStatus("Arquivo de música inválido");
        }
      });
      this.instances.set(key, audio);
    }

    this.updateStatus("");
    return this.instances.get(key);
  }

  async unlock() {
    if (this.unlocked && this.backgroundPlaying) {
      return;
    }

    this.unlocked = true;
    await this.playBackground(this.backgroundKey || BACKGROUND_KEY);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.updateToggle();
    if (!enabled) {
      this.stopAll();
      this.updateStatus("");
      return;
    }

    this.unlock();
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, Number(value)));
    this.instances.forEach((audio) => {
      audio.volume = this.volume;
    });
    this.updateFallbackVolume();
  }

  async startBackgroundOnLoad(key = BACKGROUND_KEY) {
    this.backgroundKey = key;
    await this.playBackground(key, { fromAutoplay: true });
  }

  async playBackground(key = BACKGROUND_KEY, { fromAutoplay = false } = {}) {
    this.backgroundKey = key;
    if (!this.enabled) {
      return;
    }

    const audio = await this.getAudio(key, { silentMissing: key === BACKGROUND_KEY });
    if (!audio) {
      await this.startFallbackBackground({ fromAutoplay });
      return;
    }

    this.stopFallbackBackground();
    audio.loop = true;
    audio.volume = this.volume;

    try {
      await audio.play();
      this.unlocked = true;
      this.backgroundPlaying = true;
      this.updateStatus("");
    } catch {
      this.backgroundPlaying = false;
      this.unlocked = false;
      if (fromAutoplay) {
        this.updateStatus("Clique na tela para ativar o som");
      }
    }
  }

  async stopBackground() {
    if (!this.backgroundKey) {
      return;
    }

    const audio = await this.getAudio(this.backgroundKey, { silentMissing: true });
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    this.backgroundPlaying = false;
    this.backgroundKey = BACKGROUND_KEY;
    this.stopFallbackBackground();
  }

  async playEffect(key) {
    if (!this.enabled || !this.unlocked) {
      return;
    }

    const source = await this.getAudio(key, { silentMissing: true });
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
    this.backgroundPlaying = false;
    this.stopFallbackBackground();
  }

  createFallbackBackground() {
    if (this.fallbackContext) {
      return this.fallbackContext;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    const context = new AudioContextClass();
    const masterGain = context.createGain();
    masterGain.connect(context.destination);
    this.fallbackContext = context;
    this.fallbackGain = masterGain;
    this.updateFallbackVolume();

    [196, 246.94, 329.63].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const toneGain = context.createGain();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      toneGain.gain.value = index === 0 ? 0.16 : 0.06;
      oscillator.connect(toneGain);
      toneGain.connect(masterGain);
      oscillator.start();
      this.fallbackNodes.push(oscillator, toneGain);
    });

    return context;
  }

  updateFallbackVolume() {
    if (!this.fallbackGain || !this.fallbackContext) {
      return;
    }

    const targetVolume = this.enabled ? this.volume * 0.16 : 0;
    this.fallbackGain.gain.setTargetAtTime(targetVolume, this.fallbackContext.currentTime, 0.04);
  }

  async startFallbackBackground({ fromAutoplay = false } = {}) {
    const context = this.createFallbackBackground();
    if (!context) {
      this.backgroundPlaying = false;
      this.updateStatus("Adicione musica-fundo.mp3");
      return;
    }

    try {
      if (context.state !== "running") {
        await context.resume();
      }

      if (context.state !== "running") {
        throw new Error("Audio context blocked");
      }

      this.usingFallbackBackground = true;
      this.backgroundPlaying = true;
      this.unlocked = true;
      this.updateFallbackVolume();
      this.updateStatus("");
    } catch {
      this.backgroundPlaying = false;
      this.unlocked = false;
      if (fromAutoplay) {
        this.updateStatus("Clique na tela para ativar o som");
      }
    }
  }

  stopFallbackBackground() {
    this.usingFallbackBackground = false;
    if (this.fallbackContext?.state === "running") {
      this.fallbackContext.suspend();
    }
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
  audioManager.setToggleElement(toggle);
  audioManager.startBackgroundOnLoad(BACKGROUND_KEY);

  toggle.addEventListener("click", async () => {
    const enabled = toggle.getAttribute("aria-pressed") !== "true";
    audioManager.setEnabled(enabled);
    if (enabled) {
      await audioManager.unlock();
    }
  });

  volume.addEventListener("pointerdown", () => {
    audioManager.unlock();
  });

  volume.addEventListener("input", async (event) => {
    audioManager.setVolume(event.target.value);
    await audioManager.unlock();
  });

  window.addEventListener(
    "pointerdown",
    () => {
      audioManager.unlock();
    },
    { once: true }
  );

  window.addEventListener(
    "keydown",
    () => {
      audioManager.unlock();
    },
    { once: true }
  );
}
