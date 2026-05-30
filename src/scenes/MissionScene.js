import * as Phaser from "phaser";
import { audioManager } from "../audio.js";
import {
  clearStoredParticipant,
  findParticipantPosition,
  formatNumber,
  getStoredParticipant,
  participantIdeas,
  participantPoints,
  shouldPauseCanvasResize
} from "../utils.js";
import { showIdeaForm, showRegistrationForm } from "../ui/forms.js";
import { observeParticipants } from "../ui/ideas.js";
import { showToast } from "../ui/notifications.js";

const COLORS = {
  navy: 0x08213f,
  panel: 0x102c4a,
  field: 0x0f7a3b,
  steel: 0x2f4357,
  white: 0xffffff,
  gold: 0xf4c430,
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
          this.stats.totalIdeias = participantIdeas(current);
          this.stats.totalPontos = participantPoints(current);
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
    const centerX = width / 2;
    const contentWidth = Math.min(960, width - 28);
    const isMobile = width < 720;
    const isShortViewport = isMobile && height < 640;
    const top = isShortViewport ? 66 : Math.max(78, Math.min(110, height * 0.12));

    this.drawBackground(width, height);
    this.drawLogo(width, height);

    this.add
      .text(centerX, top - 34, "Sua escalação 5S", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "18px",
        fontStyle: "900",
        color: "#f4c430",
        align: "center"
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, top, this.participant.nome, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.min(31, Math.max(22, width * 0.04))}px`,
        fontStyle: "900",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: contentWidth }
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, top + 38, `Matrícula ${this.participant.matricula}`, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "15px",
        fontStyle: "700",
        color: "#dbe8f6",
        align: "center"
      })
      .setOrigin(0.5);

    const statsY = top + (isShortViewport ? 108 : 118);
    const postStatsY = isMobile ? statsY + (isShortViewport ? 148 : 166) : top + 230;
    this.drawStats(centerX, statsY, contentWidth);

    this.add
      .text(centerX, postStatsY, "Cada melhoria registrada fortalece o 5S no dia a dia.", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.min(22, Math.max(17, width * 0.03))}px`,
        fontStyle: "900",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: contentWidth }
      })
      .setOrigin(0.5);

    if (!isShortViewport) {
      this.drawMotivationPanel(centerX, postStatsY + 48, Math.min(680, width - 34));
    }

    const buttonWidth = Math.min(340, width - 48);
    const startY = Math.min(height - 204, postStatsY + (isShortViewport ? 62 : 136));
    this.createButton(centerX, startY, buttonWidth, 58, "Marcar um Gol de Ideia", COLORS.orange, () => {
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
    const isMobile = this.scale.width < 720;
    const columns = isMobile ? 2 : 4;
    const gap = isMobile ? 8 : 14;
    const cardWidth = isMobile ? Math.min(174, (contentWidth - gap) / 2) : Math.min(210, (contentWidth - gap * 3) / 4);
    const cardHeight = isMobile ? 76 : 86;
    const rows = [
      { key: "ideasText", label: "Ideias lançadas", value: this.stats.totalIdeias, icon: "bola" },
      { key: "pointsText", label: "Pontos", value: this.stats.totalPontos, icon: "trofeu" },
      { key: "rankText", label: "Posição na tabela", value: this.stats.rankPosition ? `${this.stats.rankPosition}º` : "-", icon: "ranking" },
      { key: "turnoText", label: "Turno", value: this.participant.turno, icon: "camisa" }
    ];

    this.statTexts = {};
    rows.forEach((item, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const totalWidth = columns * cardWidth + (columns - 1) * gap;
      const x = centerX - totalWidth / 2 + cardWidth / 2 + col * (cardWidth + gap);
      const cardY = y + row * (cardHeight + gap);
      this.add.rectangle(x, cardY, cardWidth, cardHeight, COLORS.panel, 0.94).setStrokeStyle(2, COLORS.gold, 0.28);
      this.drawCardIcon(x - cardWidth / 2 + 28, cardY - 4, item.icon);
      const valueText = this.add
        .text(x + 18, cardY - 12, item.key === "rankText" || item.key === "turnoText" ? item.value : formatNumber(item.value), {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: item.key === "turnoText" ? "16px" : isMobile ? "20px" : "25px",
          fontStyle: "900",
          color: "#ffffff",
          align: "center"
        })
        .setOrigin(0.5);
      this.add
        .text(x + 18, cardY + 20, item.label, {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "11px",
          fontStyle: "800",
          color: "#a9bfd7",
          align: "center",
          wordWrap: { width: cardWidth - 62 }
        })
        .setOrigin(0.5);
      this.statTexts[item.key] = valueText;
    });
  }

  drawCardIcon(x, y, type) {
    if (type === "bola") {
      this.add.circle(x, y, 15, COLORS.white, 0.95).setStrokeStyle(2, COLORS.navy, 0.45);
      this.add.polygon(x, y, [0, -8, 7, -2, 4, 8, -4, 8, -7, -2], COLORS.navy, 0.85);
    } else if (type === "trofeu") {
      this.add.rectangle(x, y, 24, 20, COLORS.gold, 0.9);
      this.add.rectangle(x, y + 18, 10, 18, COLORS.gold, 0.9);
      this.add.rectangle(x, y + 28, 32, 7, COLORS.gold, 0.9);
    } else if (type === "ranking") {
      this.add.rectangle(x - 10, y + 8, 8, 18, COLORS.gold, 0.9);
      this.add.rectangle(x, y + 2, 8, 30, COLORS.orange, 0.95);
      this.add.rectangle(x + 10, y + 12, 8, 14, COLORS.cyan, 0.9);
    } else {
      this.add.rectangle(x, y, 30, 30, COLORS.green, 0.86).setStrokeStyle(2, COLORS.white, 0.24);
      this.add.text(x, y, "5S", { fontSize: "11px", fontStyle: "900", color: "#ffffff" }).setOrigin(0.5);
    }
  }

  updateStatsTexts() {
    if (!this.statTexts) return;
    this.statTexts.ideasText?.setText(formatNumber(this.stats.totalIdeias));
    this.statTexts.pointsText?.setText(formatNumber(this.stats.totalPontos));
    this.statTexts.rankText?.setText(this.stats.rankPosition ? `${this.stats.rankPosition}º` : "-");
    this.statTexts.turnoText?.setText(this.participant.turno);
  }

  openIdeaForm() {
    showIdeaForm({
      participant: this.participant,
      onSuccess: (result, action) => {
        this.stats.totalIdeias = participantIdeas(result.participant);
        this.stats.totalPontos = participantPoints(result.participant);
        this.stats.rankPosition = result.rankPosition;
        this.highlightPointsCard();
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

  highlightPointsCard() {
    const flash = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, COLORS.gold, 0.12);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 650,
      onComplete: () => flash.destroy()
    });
  }

  drawBackground(width, height) {
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.navy);
    this.add.rectangle(width / 2, height * 0.6, width, height * 0.85, COLORS.field, 0.78);
    this.add.rectangle(width / 2, 0, width, Math.max(160, height * 0.22), COLORS.steel, 0.45).setOrigin(0.5, 0);
    this.add.rectangle(width / 2, height * 0.6, width * 0.9, height * 0.48, COLORS.white, 0).setStrokeStyle(3, COLORS.white, 0.14);
    this.add.circle(width / 2, height * 0.6, Math.min(80, width * 0.16), COLORS.white, 0).setStrokeStyle(3, COLORS.white, 0.12);

    for (let index = 0; index < 9; index += 1) {
      this.add.rectangle(width / 2, height * 0.18 + index * 72, width * 0.96, 2, COLORS.white, 0.035);
    }

    this.add.circle(width * 0.76, height * 0.2, 92, COLORS.gold, 0.08);
    this.add.circle(width * 0.18, height * 0.72, 122, COLORS.green, 0.08);
  }

  drawLogo(width) {
    if (!this.textures.exists("logo-missao-5s")) return;
    const logo = this.add.image(74, 44, "logo-missao-5s").setOrigin(0.5);
    const source = logo.texture.getSourceImage();
    const scale = Math.min(118 / source.width, 46 / source.height);
    logo.setScale(scale);
    if (width < 520) {
      logo.setAlpha(0.72);
    }
  }

  drawMotivationPanel(x, y, width) {
    this.add.rectangle(x, y, width, 58, COLORS.navy, 0.74).setStrokeStyle(2, COLORS.gold, 0.36);
    this.add.text(x, y, "Cada ideia lançada é um gol para a Funilaria.", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "14px",
      fontStyle: "800",
      color: "#eef7ff",
      align: "center",
      wordWrap: { width: width - 28 }
    }).setOrigin(0.5);
  }

  createButton(x, y, width, height, label, color, callback) {
    const rect = this.add.rectangle(x, y, width, height, color, 1).setStrokeStyle(2, COLORS.white, 0.16);
    this.add
      .text(x, y, label, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "17px",
        fontStyle: "900",
        color: "#ffffff",
        align: "center"
      })
      .setOrigin(0.5);
    const zone = this.add.zone(x, y, width, height).setOrigin(0.5).setInteractive({ useHandCursor: true });
    let locked = false;

    zone.on("pointerover", () => rect.setAlpha(0.86));
    zone.on("pointerout", () => {
      if (!locked) rect.setAlpha(1);
    });
    zone.on("pointerup", () => {
      if (locked || document.body.classList.contains("has-active-overlay")) return;
      locked = true;
      rect.setAlpha(0.72);
      this.time.delayedCall(20, () => {
        callback();
        this.time.delayedCall(280, () => {
          if (zone.scene) {
            locked = false;
            rect.setAlpha(1);
          }
        });
      });
    });
    return { rect, zone };
  }
}
