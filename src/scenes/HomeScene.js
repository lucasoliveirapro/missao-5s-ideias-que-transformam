import * as Phaser from "phaser";
import { audioManager } from "../audio.js";
import { getStoredParticipant, shouldPauseCanvasResize } from "../utils.js";
import { showRegistrationForm } from "../ui/forms.js";

const COLORS = {
  navy: 0x08213f,
  navy2: 0x102c4a,
  field: 0x0f7a3b,
  fieldDark: 0x0b5f30,
  steel: 0x2f4357,
  white: 0xffffff,
  gold: 0xf4c430,
  orange: 0xf58220,
  cyan: 0x69d2ff
};

const PUBLIC_CREDIT =
  "Sistema desenvolvido para apoio à campanha Copa 5S — Funilaria Goiana.\nIdealização e desenvolvimento: Lucas Oliveira — Team Leader AM.";

export default class HomeScene extends Phaser.Scene {
  constructor() {
    super("HomeScene");
  }

  create() {
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
    });
    this.render();
  }

  render() {
    this.children.removeAll(true);
    const { width, height } = this.scale;
    const centerX = width / 2;
    const isMobile = width < 720;
    const isShortViewport = isMobile && height < 680;
    const top = isMobile ? (isShortViewport ? 54 : 66) : Math.max(72, height * 0.11);
    const titleY = top + (isMobile ? (isShortViewport ? 78 : 92) : 104);
    const subtitleY = titleY + (isMobile ? 56 : 74);
    const descriptionY = subtitleY + (isMobile ? 34 : 40);
    const scoreboardY = descriptionY + (isMobile ? 58 : 56);

    this.drawBackground(width, height);
    this.drawLogo(centerX, top, width, isMobile);

    const titleText = isMobile ? "Copa 5S\nFunilaria Goiana" : "Copa 5S — Funilaria Goiana";
    this.add
      .text(centerX, titleY, titleText, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.min(isMobile ? 28 : 46, Math.max(isMobile ? 22 : 30, width * (isMobile ? 0.062 : 0.062)))}px`,
        fontStyle: "900",
        color: "#ffffff",
        align: "center",
        lineSpacing: isMobile ? 4 : 0,
        wordWrap: { width: Math.min(900, width - 32) }
      })
      .setOrigin(0.5);

    const shine = this.add.rectangle(centerX, titleY + (isMobile ? 33 : 39), Math.min(520, width - 56), 4, COLORS.gold, 0.95);
    this.tweens.add({
      targets: shine,
      alpha: { from: 0.35, to: 1 },
      scaleX: { from: 0.72, to: 1 },
      duration: 1350,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut"
    });

    this.add
      .text(centerX, subtitleY, "Entre em campo com sua ideia!", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.min(isMobile ? 22 : 26, Math.max(17, width * 0.035))}px`,
        fontStyle: "800",
        color: "#f4c430",
        align: "center"
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, descriptionY, "Lance melhorias, descreva o local e ajude a Funilaria a subir de nível.", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.min(isMobile ? 17 : 20, Math.max(14, width * 0.025))}px`,
        color: "#eef7ff",
        align: "center",
        wordWrap: { width: Math.min(760, width - 44) }
      })
      .setOrigin(0.5);

    this.drawScoreboard(centerX, scoreboardY, Math.min(500, width - 42), isMobile);

    const buttonWidth = Math.min(350, width - 48);
    const buttonHeight = isMobile ? 52 : 58;
    const buttonGap = isMobile ? 64 : 76;
    const footerReserve = isMobile ? (isShortViewport ? 44 : 58) : 155;
    const buttonY = Math.min(height - footerReserve - buttonHeight - buttonGap / 2, scoreboardY + (isMobile ? 82 : 96));
    this.createButton(centerX, buttonY, buttonWidth, buttonHeight, "Entrar em Campo", COLORS.orange, () => {
      audioManager.unlock();
      audioManager.playEffect("whistle");
      const participant = getStoredParticipant();
      if (participant) {
        this.scene.start("MissionScene");
        return;
      }

      showRegistrationForm({
        onSuccess: () => this.scene.start("MissionScene")
      });
    });

    this.createButton(centerX, buttonY + buttonGap, buttonWidth, buttonHeight, "Ver Ranking da Copa 5S", COLORS.steel, () => {
      audioManager.unlock();
      this.scene.start("RankingScene", { from: "HomeScene" });
    });

    if (!isMobile || height >= 650) {
      this.add
        .text(centerX, height - (isMobile ? 40 : 54), "SIS • Funilaria • 5S", {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: isMobile ? "12px" : "14px",
          fontStyle: "800",
          color: "#dbe8f6",
          align: "center"
        })
        .setOrigin(0.5);
    }

    this.drawCreditFooter(width, height);
  }

  drawCreditFooter(width, height) {
    const compact = width < 520 || height < 640;
    const footerY = Math.max(20, height - (compact ? 7 : 14));
    const text = compact
      ? "Copa 5S — Funilaria Goiana • Lucas Oliveira — Team Leader AM."
      : PUBLIC_CREDIT;
    this.add
      .text(width / 2, footerY, text, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${compact ? 8 : width < 620 ? 9 : 10}px`,
        color: "#dbe8f6",
        align: "center",
        lineSpacing: compact ? 0 : 2,
        wordWrap: { width: Math.min(820, width - 28) }
      })
      .setOrigin(0.5, 1)
      .setAlpha(0.72);
  }

  drawBackground(width, height) {
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.navy);
    this.add.rectangle(width / 2, height * 0.58, width, height * 0.9, COLORS.field, 0.92);
    this.add.rectangle(width / 2, height * 0.58, width, height * 0.9, COLORS.fieldDark, 0.28);

    for (let index = 0; index < 8; index += 1) {
      this.add.rectangle(width * (index / 7), height * 0.58, 2, height * 0.84, COLORS.white, 0.08);
    }

    this.add.rectangle(width / 2, height * 0.58, width * 0.92, height * 0.52, COLORS.white, 0).setStrokeStyle(3, COLORS.white, 0.18);
    this.add.circle(width / 2, height * 0.58, Math.min(92, width * 0.18), COLORS.white, 0).setStrokeStyle(3, COLORS.white, 0.16);
    this.add.rectangle(width / 2, 0, width, Math.max(170, height * 0.25), COLORS.steel, 0.48).setOrigin(0.5, 0);

    for (let index = 0; index < 7; index += 1) {
      this.add.rectangle(width / 2, height * 0.11 + index * 58, width * 0.95, 2, COLORS.white, 0.03 + index * 0.006);
    }

    if (width >= 520) {
      this.drawTrophy(width * 0.82, height * 0.2, Math.min(78, width * 0.16));
      this.drawBall(width * 0.18, height * 0.31, Math.min(42, width * 0.09));
    }
    this.drawFlags(width, height);
  }

  drawLogo(x, y, width, compact = false) {
    if (this.textures.exists("logo-missao-5s")) {
      const logo = this.add.image(x, y, "logo-missao-5s");
      this.fitImage(logo, Math.min(compact ? 190 : 250, width * 0.58), Math.min(compact ? 62 : 92, width * 0.22));
      logo.setAlpha(0.98);
      return;
    }

    this.add.rectangle(x, y, Math.min(compact ? 218 : 270, width - 52), compact ? 58 : 72, COLORS.navy2, 0.95).setStrokeStyle(3, COLORS.gold, 0.9);
    this.add
      .text(x, y, "MISSÃO 5S\nFUNILARIA GOIANA", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.min(compact ? 18 : 22, Math.max(14, width * 0.038))}px`,
        fontStyle: "900",
        color: "#ffffff",
        align: "center"
      })
      .setOrigin(0.5);
  }

  drawScoreboard(x, y, width, compact = false) {
    const height = compact ? 54 : 62;
    this.add.rectangle(x, y, width, height, COLORS.navy2, 0.94).setStrokeStyle(2, COLORS.gold, 0.72);
    this.add.text(x - width * 0.36, y, "5S", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: compact ? "17px" : "20px",
      fontStyle: "900",
      color: "#f4c430"
    }).setOrigin(0.5);
    this.add.text(x, y, "Cada ideia é um gol para a Funilaria.", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: compact ? "13px" : "15px",
      fontStyle: "800",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: width - 90 }
    }).setOrigin(0.5);
  }

  fitImage(image, maxWidth, maxHeight) {
    const source = image.texture.getSourceImage();
    const scale = Math.min(maxWidth / source.width, maxHeight / source.height);
    image.setScale(scale);
  }

  drawTrophy(x, y, size) {
    this.add.rectangle(x, y + size * 0.18, size * 0.56, size * 0.58, COLORS.gold, 0.86);
    this.add.circle(x - size * 0.36, y, size * 0.26, COLORS.gold, 0).setStrokeStyle(5, COLORS.gold, 0.65);
    this.add.circle(x + size * 0.36, y, size * 0.26, COLORS.gold, 0).setStrokeStyle(5, COLORS.gold, 0.65);
    this.add.rectangle(x, y + size * 0.63, size * 0.16, size * 0.42, COLORS.gold, 0.92);
    this.add.rectangle(x, y + size * 0.88, size * 0.72, size * 0.16, COLORS.gold, 0.92);
  }

  drawBall(x, y, radius) {
    this.add.circle(x, y, radius, COLORS.white, 0.92).setStrokeStyle(2, COLORS.navy2, 0.42);
    this.add.polygon(x, y, [0, -radius * 0.48, radius * 0.42, -radius * 0.1, radius * 0.26, radius * 0.45, -radius * 0.26, radius * 0.45, -radius * 0.42, -radius * 0.1], COLORS.navy2, 0.88);
    this.tweens.add({ targets: this.add.circle(x, y, radius + 4, COLORS.white, 0.08), alpha: 0, scale: 1.55, duration: 1800, repeat: -1 });
  }

  drawFlags(width, height) {
    for (let index = 0; index < 8; index += 1) {
      const x = width * 0.08 + index * (width * 0.12);
      const y = height * 0.08 + (index % 2) * 12;
      this.add.triangle(x, y, 0, 0, 24, 8, 0, 16, index % 2 ? COLORS.gold : COLORS.orange, 0.7);
    }
  }

  createButton(x, y, width, height, label, color, callback) {
    const rect = this.add.rectangle(x, y, width, height, color, 1).setStrokeStyle(2, COLORS.white, 0.18);
    this.add
      .text(x, y, label, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "18px",
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
