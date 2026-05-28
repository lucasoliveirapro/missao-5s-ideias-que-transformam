import { getAssetPath } from "./utils.js";

const TRACKS = {
  background: "audio/musica-fundo.mp3",
  ideaSent: "audio/ideia-enviada.mp3",
  ranking: "audio/ranking.mp3",
  top3: "audio/top3.mp3",
  keepGoing: "audio/continue-participando.mp3"
};

class AudioManager {
  constructor() {
    this.enabled = true;
    this.volume = 0.42;
    this.unlocked = false;
    this.backgroundKey = null;
    this.instances = new Map();
  }

  getAudio(key) {
    if (!TRACKS[key]) {
      return null;
    }

    if (!this.instances.has(key)) {
      const audio = new Audio(getAssetPath(TRACKS[key]));
      audio.preload = "auto";
      audio.volume = this.volume;
      audio.addEventListener("error", () => {
        audio.dataset.unavailable = "true";
      });
      this.instances.set(key, audio);
    }

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

    const audio = this.getAudio(key);
    if (!audio || audio.dataset.unavailable === "true") {
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

  stopBackground() {
    if (!this.backgroundKey) {
      return;
    }

    const audio = this.getAudio(this.backgroundKey);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    this.backgroundKey = null;
  }

  playEffect(key) {
    if (!this.enabled || !this.unlocked) {
      return;
    }

    const source = this.getAudio(key);
    if (!source || source.dataset.unavailable === "true") {
      return;
    }

    try {
      const effect = source.cloneNode(true);
      effect.volume = this.volume;
      effect.play().catch(() => {});
    } catch {
      // Arquivo ausente ou formato inválido não pode interromper o jogo.
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
      <input id="volume-control" type="range" min="0" max="1" step="0.05" value="0.42" />
    </label>
  `;

  const toggle = root.querySelector("#toggle-sound");
  const volume = root.querySelector("#volume-control");

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
