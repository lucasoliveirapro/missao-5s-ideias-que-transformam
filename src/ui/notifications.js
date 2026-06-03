import { escapeHtml } from "../utils.js";

const GOAL_MESSAGES = [
  "Boa jogada!",
  "Você ajudou a Funilaria a avançar!",
  "Mais uma oportunidade no radar!",
  "5S também se vence em equipe!",
  "Continue jogando para chegar ao Top 3!"
];

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

export function triggerConfetti({ duration = 2600, count = 72 } = {}) {
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reducedMotion) {
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  const ctx = canvas.getContext("2d");
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const colors = ["#f4c430", "#16a34a", "#ffffff", "#f58220", "#69d2ff"];
  const pieces = [];
  let width = 0;
  let height = 0;
  let startTime = 0;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  resize();
  document.body.appendChild(canvas);

  for (let index = 0; index < count; index += 1) {
    pieces.push({
      x: Math.random() * width,
      y: -20 - Math.random() * height * 0.4,
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 12,
      vx: -1.6 + Math.random() * 3.2,
      vy: 2.2 + Math.random() * 3.6,
      rotation: Math.random() * Math.PI,
      spin: -0.14 + Math.random() * 0.28,
      color: colors[index % colors.length]
    });
  }

  function frame(timestamp) {
    if (!startTime) {
      startTime = timestamp;
    }

    const elapsed = timestamp - startTime;
    ctx.clearRect(0, 0, width, height);

    pieces.forEach((piece) => {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rotation += piece.spin;
      piece.vx += Math.sin(elapsed / 420 + piece.y * 0.01) * 0.02;

      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rotation);
      ctx.fillStyle = piece.color;
      ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
      ctx.restore();
    });

    if (elapsed < duration) {
      window.requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }

  window.addEventListener("resize", resize, { once: true });
  window.requestAnimationFrame(frame);
}

export function triggerGoalCelebration({
  points = 10,
  title = "GOOOOL DE IDEIA!",
  message,
  playAudio
} = {}) {
  if (playAudio) {
    playAudio();
  }

  triggerConfetti();
  const motivationalMessage = message || GOAL_MESSAGES[Math.floor(Math.random() * GOAL_MESSAGES.length)];
  const banner = document.createElement("div");
  banner.className = "goal-celebration";
  banner.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    <span>${escapeHtml(motivationalMessage)}</span>
  `;
  document.body.appendChild(banner);
  window.setTimeout(() => banner.classList.add("goal-celebration-out"), 2200);
  window.setTimeout(() => banner.remove(), 2800);

  const pointsNode = document.querySelector("[data-goal-points]");
  if (pointsNode) {
    animatePoints(pointsNode, points);
  }
}

function animatePoints(node, target) {
  const duration = 850;
  const start = performance.now();
  const value = Math.max(0, Number(target || 0));

  function tick(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    node.textContent = `+${Math.round(value * eased)} pontos`;
    if (progress < 1) {
      window.requestAnimationFrame(tick);
    }
  }

  node.textContent = "+0 pontos";
  window.requestAnimationFrame(tick);
}
