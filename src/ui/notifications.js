import { escapeHtml } from "../utils.js";

const OVERLAY_GUARDED_EVENTS = [
  "click",
  "dblclick",
  "mousedown",
  "mouseup",
  "pointerdown",
  "pointerup",
  "touchstart",
  "touchend"
];

function setPhaserInputEnabled(enabled) {
  const game = window.missao5sGame;
  if (!game?.scene) {
    return;
  }

  game.scene.getScenes(true).forEach((scene) => {
    if (scene?.input) {
      scene.input.enabled = enabled;
    }
  });
}

function installOverlayGuard(root) {
  if (!root || root.dataset.guardReady === "true") {
    return;
  }

  OVERLAY_GUARDED_EVENTS.forEach((eventName) => {
    root.addEventListener(
      eventName,
      (event) => {
        if (root.classList.contains("active")) {
          event.stopPropagation();
        }
      }
    );
  });

  root.dataset.guardReady = "true";
}

export function showToast(message, type = "info") {
  const root = document.getElementById("toast-root");
  if (!root) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  root.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("toast-out");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 4200);
}

export function setAppNotice(message) {
  const notice = document.getElementById("app-notice");
  if (!notice) {
    return;
  }

  if (!message) {
    notice.hidden = true;
    notice.innerHTML = "";
    return;
  }

  notice.hidden = false;
  notice.innerHTML = escapeHtml(message);
}

export function showOverlay(html, options = {}) {
  const root = document.getElementById("overlay-root");
  if (!root) {
    return null;
  }

  installOverlayGuard(root);
  setPhaserInputEnabled(false);
  root.innerHTML = html;
  root.className = options.className || "overlay-root active";
  root.hidden = false;
  document.body.classList.add("has-active-overlay");
  return root;
}

export function hideOverlay() {
  const root = document.getElementById("overlay-root");
  if (!root) {
    return;
  }

  root.innerHTML = "";
  root.className = "";
  root.hidden = true;
  document.body.classList.remove("has-active-overlay");
  setPhaserInputEnabled(true);
  window.dispatchEvent(new CustomEvent("missao5s:overlay-closed"));
}

export function setBusy(button, busy, label) {
  if (!button) {
    return;
  }

  button.disabled = busy;
  if (label) {
    button.textContent = label;
  }
}
