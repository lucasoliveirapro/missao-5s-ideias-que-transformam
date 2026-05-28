import { escapeHtml } from "../utils.js";

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

  root.innerHTML = html;
  root.className = options.className || "overlay-root active";
  root.hidden = false;
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
