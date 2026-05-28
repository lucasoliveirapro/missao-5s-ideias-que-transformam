import * as Phaser from "phaser";
import { audioManager } from "../audio.js";
import {
  clearStoredParticipant,
  findParticipantPosition,
  formatNumber,
  getStoredParticipant,
  shouldPauseCanvasResize
} from "../utils.js";
import { showIdeaForm, showRegistrationForm } from "../ui/forms.js";
import { observeParticipants } from "../ui/ideas.js";
import { showToast } from "../ui/notifications.js";

const COLORS = {
  navy: 0x0b1f3a,
  panel: 0x102c4a,
  steel: 0x28445f,
  white: 0xffffff,
  orange: 0xf58220,
  green: 0x18a66a,
  cyan: 0x69d2ff
};

export default class MissionScene extends Phaser.Scene {
  constructor() {
    super("MissionScene");
  }

  create() {
    this.participant = getStoredParticipant();
    this.stats = {
      totalIdeias: 0,
      totalPontos: 0,
      rankPosition: null
    };

    if (!this.participant) {
      showRegistrationForm({
        onSuccess: () => this.scene.restart(),
        onCancel: () => this.scene.start("HomeScene")
      });
      return;
    }

    this.resizeHandler = () => {
      if (!shouldPauseCanvasResize()) {
        this.render();
      }
    };
    this.overlayClosedHandler = () => this.render();
    this.scale.on("resize", this.resizeHandler);
    window.addEventListener("missao5s:overlay-closed", this.overlayClosedHandler);
    this.events.once("shutdown", () => {
      this.scale.off("resize", this.resizeHandler);
      window.removeEventListener("missao5s:overlay-closed", this.overlayClosedHandler);
      if (this.unsubscribeParticipants) this.unsubscribeParticipants();
    });

    this.render();
    audioManager.playBackground("background");

    this.unsubscribeParticipants = observeParticipants(
      (participants) => {
        const current = participants.find((item) => item.matricula === this.participant.matricula);
        if (current) {
          this.participant = {
            nome: current.nome,
            matricula: current.matricula,
            turno: current.turno
          };
          this.stats.totalIdeias = Number(current.totalIdeias || 0);
          this.stats.totalPontos = Number(current.totalPontos || 0);
        }
        this.stats.rankPosition = findParticipantPosition(participants, this.participant.matricula);
        this.updateStatsTexts();
      },
      () => showToast("Não foi possível carregar seus dados online.", "error")
    );
  }

  render() {
    this.children.removeAll(true);
    const { width, height } = this.scale;
    this.drawBackground(width, height);

    const centerX = width / 2;
    const contentWidth = Math.min(920, width - 32);
    const top = Math.max(64, Math.min(92, height * 0.1));

    this.add
      .text(centerX, top - 34, "Missão em andamento", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "16px",
        fontStyle: "700",
        color: "#f58220",
        align: "center"
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, top, this.participant.nome, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.min(32, Math.max(22, width * 0.042))}px`,
        fontStyle: "700",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: contentWidth }
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, top + 42, `Matrícula ${this.participant.matricula} • ${this.participant.turno}`, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "16px",
        color: "#dbe8f6",
        align: "center"
      })
      .setOrigin(0.5);

    this.drawStats(centerX, top + 112, contentWidth);

    this.add
      .text(centerX, top + 218, "Viu uma oportunidade de melhoria? Registre sua ideia!", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.min(24, Math.max(18, width * 0.034))}px`,
        fontStyle: "700",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: contentWidth }
      })
      .setOrigin(0.5);

    const buttonWidth = Math.min(320, width - 48);
    const startY = Math.min(height - 205, top + 292);
    this.createButton(centerX, startY, buttonWidth, 58, "Lançar Nova Ideia", COLORS.orange, () => {
      audioManager.unlock();
      this.openIdeaForm();
    });
    this.createButton(centerX, startY + 74, buttonWidth, 54, "Ver Ranking", COLORS.steel, () => {
      audioManager.unlock();
      this.scene.start("RankingScene", { from: "MissionScene" });
    });
    this.createButton(centerX, startY + 142, buttonWidth, 52, "Trocar Participante", COLORS.panel, () => {
      clearStoredParticipant();
      showRegistrationForm({
        onSuccess: () => this.scene.restart(),
        onCancel: () => this.scene.start("HomeScene")
      });
    });
  }

  drawStats(centerX, y, contentWidth) {
    const isMobile = this.scale.width < 680;
    const statWidth = isMobile ? Math.min(178, (contentWidth - 12) / 3) : Math.min(210, (contentWidth - 36) / 3);
    const gap = isMobile ? 6 : 18;
    const labels = [
      ["ideiasText", "Ideias", this.stats.totalIdeias],
      ["pointsText", "Pontos", this.stats.totalPontos],
      ["rankText", "Posição", this.stats.rankPosition ? `${this.stats.rankPosition}º` : "-"]
    ];

    this.statTexts = {};
    labels.forEach(([key, label, value], index) => {
      const x = centerX + (index - 1) * (statWidth + gap);
      this.add.rectangle(x, y, statWidth, 88, COLORS.panel, 0.92).setStrokeStyle(1, COLORS.cyan, 0.18);
      const valueText = this.add
        .text(x, y - 12, key === "rankText" ? value : formatNumber(value), {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: isMobile ? "22px" : "28px",
          fontStyle: "700",
          color: "#ffffff"
        })
        .setOrigin(0.5);
      this.add
        .text(x, y + 22, label, {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "13px",
          color: "#a9bfd7"
        })
        .setOrigin(0.5);
      this.statTexts[key] = valueText;
    });
  }

  updateStatsTexts() {
    if (!this.statTexts) {
      return;
    }

    this.statTexts.ideasText?.setText(formatNumber(this.stats.totalIdeias));
    this.statTexts.pointsText?.setText(formatNumber(this.stats.totalPontos));
    this.statTexts.rankText?.setText(this.stats.rankPosition ? `${this.stats.rankPosition}º` : "-");
  }

  openIdeaForm() {
    showIdeaForm({
      participant: this.participant,
      onSuccess: (result, action) => {
        this.stats.totalIdeias = result.participant.totalIdeias;
        this.stats.totalPontos = result.participant.totalPontos;
        this.stats.rankPosition = result.rankPosition;
        this.updateStatsTexts();

        if (action === "another") {
          this.openIdeaForm();
          return;
        }

        if (action === "ranking") {
          this.scene.start("RankingScene", { from: "MissionScene" });
        }
      }
    });
  }

  drawBackground(width, height) {
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.navy);
    if (this.textures.exists("factory-bg")) {
      const bg = this.add.image(width / 2, height / 2, "factory-bg");
      bg.setDisplaySize(width, height);
      bg.setAlpha(0.22);
    }

    this.add.rectangle(width / 2, 0, width, Math.max(160, height * 0.22), COLORS.steel, 0.32).setOrigin(0.5, 0);
    this.add.circle(width * 0.76, height * 0.2, 92, COLORS.orange, 0.08);
    this.add.circle(width * 0.18, height * 0.72, 122, COLORS.green, 0.08);

    const indicator = this.add.rectangle(width * 0.12, height * 0.44, 10, 88, COLORS.orange, 0.82);
    this.tweens.add({
      targets: indicator,
      y: indicator.y + 14,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut"
    });
  }

  createButton(x, y, width, height, label, color, callback) {
    const container = this.add.container(x, y);
    const rect = this.add
      .rectangle(0, 0, width, height, color, 1)
      .setStrokeStyle(2, COLORS.white, 0.14)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(0, 0, label, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "17px",
        fontStyle: "700",
        color: "#ffffff"
      })
      .setOrigin(0.5);
    container.add([rect, text]);
    rect.on("pointerover", () => rect.setAlpha(0.86));
    rect.on("pointerout", () => rect.setAlpha(1));
    rect.on("pointerdown", callback);
    return container;
  }
}
