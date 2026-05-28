import * as Phaser from "phaser";
import { audioManager } from "../audio.js";
import { formatNumber, getRankableParticipants, getStoredParticipant, shouldPauseCanvasResize } from "../utils.js";
import { observeParticipants } from "../ui/ideas.js";
import { closeRankingPanel, showRankingPanel, updateRankingPanel } from "../ui/ranking.js";
import { showToast } from "../ui/notifications.js";

const COLORS = {
  navy: 0x0b1f3a,
  panel: 0x102c4a,
  steel: 0x28445f,
  white: 0xffffff,
  orange: 0xf58220,
  gold: 0xffc547,
  silver: 0xc9d3df,
  bronze: 0xc9814a
};

export default class RankingScene extends Phaser.Scene {
  constructor() {
    super("RankingScene");
  }

  init(data = {}) {
    this.fromScene = data.from || "HomeScene";
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
        this.scene.stop(targetScene === "MissionScene" ? "HomeScene" : "MissionScene");
        this.scene.start(targetScene);
      }
    });

    this.unsubscribeParticipants = observeParticipants(
      (participants) => {
        this.participants = getRankableParticipants(participants);
        this.renderTop3();
        updateRankingPanel(participants);
      },
      () => showToast("Não foi possível carregar o ranking.", "error")
    );
  }

  render() {
    this.topGroup = null;
    this.children.removeAll(true);
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.navy);

    if (this.textures.exists("factory-bg")) {
      const bg = this.add.image(width / 2, height / 2, "factory-bg");
      bg.setDisplaySize(width, height);
      bg.setAlpha(0.18);
    }

    const titleY = this.getTitleY(width, height);

    this.add
      .text(width / 2, titleY, "Top 3 — Quem mais lançou ideias", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.min(34, Math.max(22, width * 0.04))}px`,
        fontStyle: "700",
        color: "#ffffff",
        align: "center"
      })
      .setOrigin(0.5);

    this.renderTop3();
  }

  getTitleY(width, height) {
    const isMobile = width < 700;
    const visibleTopHeight = height * (isMobile ? 0.46 : 0.54);
    return Math.max(isMobile ? 52 : 42, Math.min(68, visibleTopHeight * 0.18));
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
    const visibleTopHeight = height * (isMobile ? 0.46 : 0.54);
    const cardWidth = isMobile ? Math.min(190, (width - 36) / 3) : Math.min(260, (width - 80) / 3);
    const cardHeight = isMobile
      ? Math.min(140, Math.max(102, visibleTopHeight - titleY - 48))
      : Math.min(168, Math.max(96, visibleTopHeight - titleY - 54));
    const gap = isMobile ? 8 : 22;
    const startX = width / 2 - cardWidth - gap;
    const y = titleY + cardHeight / 2 + (isMobile ? 56 : 48);
    const medalKeys = ["medal-gold", "medal-silver", "medal-bronze"];
    const fallbackColors = [COLORS.gold, COLORS.silver, COLORS.bronze];
    const podiumSlots = [
      { rankIndex: 1, slotIndex: 0 },
      { rankIndex: 0, slotIndex: 1 },
      { rankIndex: 2, slotIndex: 2 }
    ];

    podiumSlots.forEach(({ rankIndex, slotIndex }) => {
      const participant = top3[rankIndex];
      const isFirstPlace = rankIndex === 0;
      const x = startX + slotIndex * (cardWidth + gap);
      const cardY = y + (isFirstPlace ? -8 : 8);
      const currentCardHeight = cardHeight + (isFirstPlace ? 16 : 0);
      const card = this.add
        .rectangle(x, cardY, cardWidth, currentCardHeight, COLORS.panel, 0.94)
        .setStrokeStyle(2, fallbackColors[rankIndex], 0.72);
      const medalY = cardY - currentCardHeight / 2 + 34;
      group.add(card);

      if (this.textures.exists(medalKeys[rankIndex])) {
        const medal = this.add.image(x, medalY, medalKeys[rankIndex]);
        medal.setDisplaySize(isMobile ? 42 : isFirstPlace ? 62 : 54, isMobile ? 42 : isFirstPlace ? 62 : 54);
        group.add(medal);
      } else {
        group.add(this.add.circle(x, medalY, isMobile ? 22 : isFirstPlace ? 31 : 27, fallbackColors[rankIndex], 1));
      }

      group.add(
        this.add
          .text(x, cardY + 18, participant?.nome || "Aguardando ideias", {
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: isMobile ? "13px" : "16px",
            fontStyle: "700",
            color: "#ffffff",
            align: "center",
            wordWrap: { width: cardWidth - 18 }
          })
          .setOrigin(0.5)
      );

      group.add(
        this.add
          .text(
            x,
            cardY + currentCardHeight / 2 - (isMobile ? 22 : 18),
            participant
              ? `${formatNumber(participant.totalIdeias)} ideias • ${formatNumber(participant.totalPontos)} pts`
              : "0 ideias • 0 pts",
            {
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: isMobile ? "11px" : "13px",
              color: "#dbe8f6",
              align: "center",
              wordWrap: { width: cardWidth - 18 }
            }
          )
          .setOrigin(0.5)
      );
    });

    const bar = this.add.rectangle(width / 2, y + cardHeight / 2 + 36, Math.min(width - 48, 720), 4, COLORS.orange, 0.88);
    group.add(bar);
  }
}
