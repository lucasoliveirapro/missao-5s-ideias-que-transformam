import * as Phaser from "phaser";
import { audioManager } from "../audio.js";
import {
  findParticipantPosition,
  formatNumber,
  getRankableParticipants,
  getStoredParticipant,
  participantIdeas,
  participantPoints,
  sharpenSceneText,
  shouldPauseCanvasResize
} from "../utils.js";
import { observeParticipants } from "../ui/ideas.js";
import { closeRankingPanel, showRankingPanel, updateRankingPanel } from "../ui/ranking.js";
import { showToast, triggerConfetti } from "../ui/notifications.js";

const COLORS = {
  navy: 0x08213f,
  panel: 0x102c4a,
  field: 0x0f7a3b,
  steel: 0x2f4357,
  white: 0xffffff,
  orange: 0xf58220,
  gold: 0xf4c430,
  silver: 0xc9d3df,
  bronze: 0xc9814a,
  cyan: 0x69d2ff
};

const PUBLIC_CREDIT =
  "Sistema desenvolvido para apoio à campanha Copa 5S — Funilaria Goiana.\nIdealização e desenvolvimento: Lucas Oliveira — Team Leader AM.";

export default class RankingScene extends Phaser.Scene {
  constructor() {
    super("RankingScene");
  }

  init(data = {}) {
    this.fromScene = data.from || "HomeScene";
    this.top3Celebrated = false;
  }

  create() {
    this.participants = [];
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
      closeRankingPanel();
      if (this.unsubscribeParticipants) this.unsubscribeParticipants();
    });

    this.render();
    audioManager.playEffect("ranking");

    showRankingPanel([], {
      onBack: () => {
        const participant = getStoredParticipant();
        const targetScene = this.fromScene === "MissionScene" && participant ? "MissionScene" : "HomeScene";
        this.scene.start(targetScene);
      }
    });

    this.unsubscribeParticipants = observeParticipants(
      (participants) => {
        this.participants = getRankableParticipants(participants);
        this.renderTop3();
        updateRankingPanel(participants);
        this.celebrateCurrentParticipant(participants);
      },
      () => showToast("Não foi possível carregar o ranking.", "error")
    );
  }

  render() {
    this.topGroup = null;
    this.children.removeAll(true);
    const { width, height } = this.scale;
    this.drawBackground(width, height);

    const titleY = this.getTitleY(width, height);
    this.drawLogo(width);
    this.add
      .text(width / 2, titleY, "TABELA DA COPA 5S", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.min(width < 520 ? 25 : 36, Math.max(width < 520 ? 20 : 23, width * 0.045))}px`,
        fontStyle: "900",
        color: "#ffffff",
        align: "center"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, titleY + 38, "Artilheiros de Ideias", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.min(width < 520 ? 18 : 22, Math.max(15, width * 0.029))}px`,
        fontStyle: "900",
        color: "#f4c430",
        align: "center"
      })
      .setOrigin(0.5);

    this.renderTop3();
    sharpenSceneText(this);
  }

  getTitleY(width, height) {
    const isMobile = width < 700;
    const visibleTopHeight = this.getTopAreaHeight(width, height);
    return Math.max(isMobile ? 52 : 44, Math.min(76, visibleTopHeight * 0.16));
  }

  getTopAreaHeight(width, height) {
    if (width < 520) {
      return Math.max(248, Math.min(318, height * 0.46));
    }

    return height * (width < 700 ? 0.46 : 0.54);
  }

  renderTop3() {
    if (this.topGroup?.scene) {
      this.topGroup.destroy(true);
    }

    const { width, height } = this.scale;
    const top3 = this.participants.slice(0, 3);
    const group = this.add.container(0, 0);
    this.topGroup = group;

    const isMobile = width < 700;
    const titleY = this.getTitleY(width, height);
    const visibleTopHeight = this.getTopAreaHeight(width, height);
    if (width < 520) {
      this.renderCompactTop3(group, top3, titleY, visibleTopHeight);
      return;
    }
    const cardWidth = isMobile ? Math.min(190, (width - 36) / 3) : Math.min(260, (width - 80) / 3);
    const cardHeight = isMobile
      ? Math.min(136, Math.max(102, visibleTopHeight - titleY - 92))
      : Math.min(168, Math.max(96, visibleTopHeight - titleY - 96));
    const gap = isMobile ? 8 : 22;
    const startX = width / 2 - cardWidth - gap;
    const y = titleY + 74 + cardHeight / 2;
    const colors = [COLORS.gold, COLORS.silver, COLORS.bronze];
    const slots = [
      { rankIndex: 1, slotIndex: 0 },
      { rankIndex: 0, slotIndex: 1 },
      { rankIndex: 2, slotIndex: 2 }
    ];

    slots.forEach(({ rankIndex, slotIndex }) => {
      const participant = top3[rankIndex];
      const isFirstPlace = rankIndex === 0;
      const x = startX + slotIndex * (cardWidth + gap);
      const cardY = y + (isFirstPlace ? -8 : 10);
      const currentCardHeight = cardHeight + (isFirstPlace ? 20 : 0);
      const color = colors[rankIndex];
      group.add(this.add.rectangle(x, cardY, cardWidth, currentCardHeight, COLORS.panel, 0.94).setStrokeStyle(2, color, 0.78));

      if (isFirstPlace) {
        this.drawSmallTrophy(group, x, cardY - currentCardHeight / 2 + 18, isMobile ? 20 : 24);
      }
      this.drawMedal(group, x, cardY - currentCardHeight / 2 + (isFirstPlace ? 48 : 34), rankIndex + 1, color, isFirstPlace, isMobile);

      group.add(
        this.add
          .text(x, cardY + 20, participant?.nome || "Aguardando ideias", {
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: isMobile ? "12px" : "16px",
            fontStyle: "900",
            color: "#ffffff",
            align: "center",
            wordWrap: { width: cardWidth - 16 }
          })
          .setOrigin(0.5)
      );

      group.add(
        this.add
          .text(
            x,
            cardY + currentCardHeight / 2 - (isMobile ? 20 : 18),
            participant
              ? `${formatNumber(participantIdeas(participant))} gols • ${formatNumber(participantPoints(participant))} pts`
              : "0 gols • 0 pts",
            {
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: isMobile ? "10px" : "13px",
              fontStyle: "800",
              color: "#dbe8f6",
              align: "center",
              wordWrap: { width: cardWidth - 18 }
            }
          )
          .setOrigin(0.5)
      );
    });

    group.add(this.add.rectangle(width / 2, y + cardHeight / 2 + 38, Math.min(width - 48, 720), 4, COLORS.orange, 0.9));
    this.drawCreditFooter(width, visibleTopHeight);
    sharpenSceneText(this);
  }

  renderCompactTop3(group, top3, titleY, visibleTopHeight) {
    const { width } = this.scale;
    const colors = [COLORS.gold, COLORS.silver, COLORS.bronze];
    const leader = top3[0];
    const leaderWidth = Math.min(width - 42, 308);
    const leaderHeight = 104;
    const leaderY = titleY + 104;

    group.add(this.add.rectangle(width / 2, leaderY, leaderWidth, leaderHeight, COLORS.panel, 0.96).setStrokeStyle(2, COLORS.gold, 0.9));
    this.drawSmallTrophy(group, width / 2, leaderY - 38, 18);
    this.drawMedal(group, width / 2, leaderY - 18, 1, COLORS.gold, true, true);
    group.add(
      this.add
        .text(width / 2, leaderY + 18, leader?.nome || "Aguardando ideias", {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "14px",
          fontStyle: "900",
          color: "#ffffff",
          align: "center",
          wordWrap: { width: leaderWidth - 24 }
        })
        .setOrigin(0.5)
    );
    group.add(
      this.add
        .text(
          width / 2,
          leaderY + 42,
          leader ? `${formatNumber(participantIdeas(leader))} gols • ${formatNumber(participantPoints(leader))} pts` : "0 gols • 0 pts",
          {
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "11px",
            fontStyle: "800",
            color: "#dbe8f6",
            align: "center"
          }
        )
        .setOrigin(0.5)
    );

    const miniWidth = Math.min((width - 54) / 2, 152);
    const miniHeight = 66;
    const miniY = Math.min(visibleTopHeight - 45, leaderY + 88);
    [1, 2].forEach((rankIndex, index) => {
      const participant = top3[rankIndex];
      const x = width / 2 + (index === 0 ? -miniWidth / 2 - 7 : miniWidth / 2 + 7);
      group.add(this.add.rectangle(x, miniY, miniWidth, miniHeight, COLORS.panel, 0.92).setStrokeStyle(2, colors[rankIndex], 0.78));
      this.drawMedal(group, x - miniWidth / 2 + 28, miniY - 10, rankIndex + 1, colors[rankIndex], false, true);
      group.add(
        this.add
          .text(x + 18, miniY - 8, participant?.nome || "Aguardando", {
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "10px",
            fontStyle: "900",
            color: "#ffffff",
            align: "center",
            wordWrap: { width: miniWidth - 58 }
          })
          .setOrigin(0.5)
      );
      group.add(
        this.add
          .text(
            x + 18,
            miniY + 18,
            participant ? `${formatNumber(participantIdeas(participant))} gols` : "0 gols",
            {
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: "9px",
              fontStyle: "800",
              color: "#dbe8f6",
              align: "center"
            }
          )
          .setOrigin(0.5)
      );
    });

    if (visibleTopHeight - (miniY + miniHeight / 2) > 30) {
      group.add(this.add.rectangle(width / 2, visibleTopHeight - 24, Math.min(width - 42, 330), 3, COLORS.orange, 0.9));
    }
    this.drawCreditFooter(width, visibleTopHeight);
    sharpenSceneText(this);
  }

  drawCreditFooter(width, visibleTopHeight) {
    if (this.creditText?.scene) {
      this.creditText.destroy();
    }

    const compact = width < 520;
    const text = compact
      ? "Copa 5S — Funilaria Goiana • Lucas Oliveira — Team Leader AM."
      : PUBLIC_CREDIT;
    this.creditText = this.add
      .text(width / 2, visibleTopHeight - (compact ? 5 : 10), text, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${compact ? 7 : width < 620 ? 8 : 10}px`,
        color: "#dbe8f6",
        align: "center",
        lineSpacing: compact ? 0 : 1,
        wordWrap: { width: Math.min(820, width - 28) }
      })
      .setOrigin(0.5, 1)
      .setAlpha(0.66);
  }

  celebrateCurrentParticipant(participants) {
    if (this.top3Celebrated) return;
    const participant = getStoredParticipant();
    if (!participant) return;
    const position = findParticipantPosition(participants, participant.matricula);
    if (position && position <= 3) {
      this.top3Celebrated = true;
      triggerConfetti({ count: 48, duration: 2000 });
      showToast("Você está no Top 3!", "success");
      audioManager.playEffect("top3");
    }
  }

  drawBackground(width, height) {
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.navy);
    this.add.rectangle(width / 2, height * 0.56, width, height * 0.86, COLORS.field, 0.78);
    this.add.rectangle(width / 2, 0, width, Math.max(150, height * 0.22), COLORS.steel, 0.42).setOrigin(0.5, 0);
    this.add.rectangle(width / 2, height * 0.56, width * 0.92, height * 0.46, COLORS.white, 0).setStrokeStyle(3, COLORS.white, 0.13);
    this.add.circle(width / 2, height * 0.56, Math.min(80, width * 0.16), COLORS.white, 0).setStrokeStyle(3, COLORS.white, 0.11);
    for (let index = 0; index < 8; index += 1) {
      this.add.rectangle(width * (index / 7), height * 0.58, 2, height * 0.8, COLORS.white, 0.05);
    }
  }

  drawLogo(width) {
    if (!this.textures.exists("logo-missao-5s")) return;
    const logo = this.add.image(78, 42, "logo-missao-5s").setOrigin(0.5);
    const source = logo.texture.getSourceImage();
    logo.setScale(Math.min(118 / source.width, 44 / source.height));
    if (width < 520) logo.setAlpha(0.64);
  }

  drawSmallTrophy(group, x, y, size) {
    group.add(this.add.rectangle(x, y, size * 0.72, size * 0.62, COLORS.gold, 0.9));
    group.add(this.add.rectangle(x, y + size * 0.48, size * 0.22, size * 0.55, COLORS.gold, 0.9));
    group.add(this.add.rectangle(x, y + size * 0.82, size * 0.84, size * 0.16, COLORS.gold, 0.9));
  }

  drawMedal(group, x, y, rank, color, isFirstPlace, isMobile) {
    const radius = isMobile ? 19 : isFirstPlace ? 27 : 24;
    group.add(this.add.rectangle(x - radius * 0.28, y - radius * 0.9, radius * 0.36, radius * 0.7, color, 0.9).setAngle(-10));
    group.add(this.add.rectangle(x + radius * 0.28, y - radius * 0.9, radius * 0.36, radius * 0.7, color, 0.9).setAngle(10));
    group.add(this.add.circle(x, y, radius, color, 1).setStrokeStyle(4, COLORS.white, 0.24));
    group.add(this.add.star(x, y, 5, radius * 0.28, radius * 0.56, COLORS.white, 0.72));
    group.add(
      this.add
        .text(x, y, String(rank), {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: `${Math.max(12, radius * 0.56)}px`,
          fontStyle: "900",
          color: "#102c4a"
        })
        .setOrigin(0.5)
    );
  }
}
