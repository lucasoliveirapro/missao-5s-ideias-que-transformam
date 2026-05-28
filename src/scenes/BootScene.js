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

    this.load.svg("factory-bg", getAssetPath("images/factory-bg.svg"), { width: 1600, height: 900 });
    this.load.svg("logo-5s", getAssetPath("images/logo-placeholder.svg"), { width: 240, height: 240 });
    this.load.svg("medal-gold", getAssetPath("images/medal-gold.svg"), { width: 128, height: 128 });
    this.load.svg("medal-silver", getAssetPath("images/medal-silver.svg"), { width: 128, height: 128 });
    this.load.svg("medal-bronze", getAssetPath("images/medal-bronze.svg"), { width: 128, height: 128 });
  }

  create() {
    this.scene.start("HomeScene");
  }
}
