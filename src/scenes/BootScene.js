import * as Phaser from "phaser";
import { getAssetPath } from "../utils.js";

const LOGO_SVG_SIZE = { width: 1440, height: 480 };
const LOGO_ICON_SVG_SIZE = { width: 512, height: 512 };

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.on("loaderror", (file) => {
      console.warn(`Asset não carregado: ${file?.src || file?.key}`);
    });
    this.load.svg("logo-missao-5s", getAssetPath("images/logo-missao-5s.svg"), LOGO_SVG_SIZE);
    this.load.svg("logo-missao-5s-icon", getAssetPath("images/logo-missao-5s-icon.svg"), LOGO_ICON_SVG_SIZE);
  }

  create() {
    this.scene.start("HomeScene");
  }
}
