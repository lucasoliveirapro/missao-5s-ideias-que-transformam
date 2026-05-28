import * as Phaser from "phaser";
import { audioManager } from "../audio.js";
import { getStoredParticipant, shouldPauseCanvasResize } from "../utils.js";
import { showRegistrationForm } from "../ui/forms.js";

const COLORS = {
  navy: 0x0b1f3a,
  navy2: 0x102c4a,
  steel: 0x28445f,
  white: 0xffffff,
  orange: 0xf58220,
  cyan: 0x69d2ff
};

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
    const top = Math.max(72, height * 0.12);

    this.drawBackground(width, height);
    this.drawShield(centerX, top - 16, Math.min(82, width * 0.2));

    this.add
      .text(centerX, top + 68, "Missão 5S", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.min(64, Math.max(42, width * 0.08))}px`,
        fontStyle: "700",
        color: "#ffffff",
        align: "center"
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, top + 126, "Ideias que Transformam", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.min(34, Math.max(22, width * 0.045))}px`,
        fontStyle: "700",
        color: "#f58220",
        align: "center"
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, top + 176, "Lance melhorias bem descritas e suba no ranking.", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.min(21, Math.max(16, width * 0.026))}px`,
        color: "#dbe8f6",
        align: "center",
        wordWrap: { width: Math.min(720, width - 44) }
      })
      .setOrigin(0.5);

    this.createAccentLine(centerX, top + 216, Math.min(360, width - 72));

    const buttonWidth = Math.min(330, width - 48);
    const buttonY = Math.min(height - 160, top + 300);
    this.createButton(centerX, buttonY, buttonWidth, 58, "Entrar na Missão", COLORS.orange, () => {
      audioManager.unlock();
      const participant = getStoredParticipant();
      if (participant) {
        this.scene.start("MissionScene");
        return;
      }

      showRegistrationForm({
        onSuccess: () => this.scene.start("MissionScene")
      });
    });

    this.createButton(centerX, buttonY + 76, buttonWidth, 58, "Ver Ranking", COLORS.steel, () => {
      audioManager.unlock();
      this.scene.start("RankingScene", { from: "HomeScene" });
    });

    this.add
      .text(centerX, height - 34, "SIS • Funilaria • 5S", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "14px",
        color: "#9fb2c7",
        align: "center"
      })
      .setOrigin(0.5);
  }

  drawBackground(width, height) {
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.navy);
    this.add.rectangle(width / 2, 0, width, Math.max(160, height * 0.24), COLORS.steel, 0.32).setOrigin(0.5, 0);

    for (let index = 0; index < 9; index += 1) {
      const y = height * 0.16 + index * 72;
      this.add.rectangle(width / 2, y, width * 0.96, 2, COLORS.white, 0.04 + index * 0.004);
    }

    for (let index = 0; index < 8; index += 1) {
      const x = width * 0.08 + index * (width / 7);
      this.add.rectangle(x, height * 0.52, 2, height * 0.78, COLORS.white, 0.035);
    }

    const beam = this.add.rectangle(width * 0.18, height * 0.55, 14, height * 0.9, COLORS.orange, 0.26);
    beam.setAngle(-18);
    this.tweens.add({
      targets: beam,
      alpha: { from: 0.16, to: 0.4 },
      duration: 1800,
      yoyo: true,
      repeat: -1
    });

    this.add.circle(width * 0.82, height * 0.24, 110, COLORS.cyan, 0.08);
    this.add.circle(width * 0.22, height * 0.72, 130, COLORS.orange, 0.07);
  }

  drawShield(x, y, size) {
    const points = [
      -0.42, -0.45,
      0.42, -0.45,
      0.36, 0.16,
      0, 0.5,
      -0.36, 0.16
    ].map((value) => value * size);
    this.add.polygon(x, y, points, COLORS.navy2, 0.95).setStrokeStyle(3, COLORS.orange, 0.9);
    this.add.text(x, y - size * 0.05, "5S", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: `${Math.max(22, size * 0.34)}px`,
      fontStyle: "900",
      color: "#ffffff"
    }).setOrigin(0.5);
  }

  createAccentLine(x, y, width) {
    this.add.rectangle(x, y, width, 4, COLORS.orange, 0.95);
    this.add.rectangle(x, y + 8, width * 0.62, 2, COLORS.cyan, 0.85);
  }

  createButton(x, y, width, height, label, color, callback) {
    const rect = this.add.rectangle(x, y, width, height, color, 1).setStrokeStyle(2, COLORS.white, 0.16);
    this.add
      .text(x, y, label, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "18px",
        fontStyle: "700",
        color: "#ffffff"
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
