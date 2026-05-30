import * as Phaser from "phaser";
import { getAssetPath } from "../utils.js";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.on("loaderror", (file) => {
      console.warn(`Asset não carregado: ${file?.src || file?.key}`);
    });
    this.load.image("logo-missao-5s", getAssetPath("images/logo-missao-5s.png"));
    this.load.image("logo-missao-5s-icon", getAssetPath("images/logo-missao-5s-icon.png"));
  }

  create() {
    this.scene.start("HomeScene");
  }
}
