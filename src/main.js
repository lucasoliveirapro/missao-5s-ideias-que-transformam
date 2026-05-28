import * as Phaser from "phaser";
import BootScene from "./scenes/BootScene.js";
import HomeScene from "./scenes/HomeScene.js";
import MissionScene from "./scenes/MissionScene.js";
import RankingScene from "./scenes/RankingScene.js";
import { setupAudioControls } from "./audio.js";
import { isFirebaseConfigured } from "./firebase.js";
import { FIREBASE_CONFIG_MESSAGE } from "./ui/ideas.js";
import { setAppNotice } from "./ui/notifications.js";

setupAudioControls();

if (!isFirebaseConfigured()) {
  setAppNotice(FIREBASE_CONFIG_MESSAGE);
}

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  backgroundColor: "#0b1f3a",
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight
  },
  render: {
    antialias: true,
    pixelArt: false
  },
  scene: [BootScene, HomeScene, MissionScene, RankingScene]
};

window.missao5sGame = new Phaser.Game(config);
