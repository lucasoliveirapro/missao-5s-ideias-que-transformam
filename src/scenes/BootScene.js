import * as Phaser from "phaser";
import { getAssetPath } from "../utils.js";

const LOGO_SVG_SIZE = { width: 1440, height: 480 };
const LOGO_ICON_SVG_SIZE = { width: 512, height: 512 };
const ASSET_CHECK_TIMEOUT_MS = 1200;

const LOGO_CANDIDATES = [
  { path: "images/logo-missao-5s.png", type: "image" },
  { path: "images/logo-missao-5s.svg", type: "svg", svgConfig: LOGO_SVG_SIZE }
];

const LOGO_ICON_CANDIDATES = [
  { path: "images/logo-missao-5s-icon.png", type: "image" },
  { path: "images/logo-missao-5s-icon.svg", type: "svg", svgConfig: LOGO_ICON_SVG_SIZE }
];

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    this.loadLogoAssets();
  }

  async loadLogoAssets() {
    this.load.on("loaderror", (file) => {
      console.warn(`Asset não carregado: ${file?.src || file?.key}`);
    });

    const assets = await Promise.all([
      this.findFirstAvailableAsset(LOGO_CANDIDATES),
      this.findFirstAvailableAsset(LOGO_ICON_CANDIDATES)
    ]);

    const queued = [
      this.queueTexture("logo-missao-5s", assets[0]),
      this.queueTexture("logo-missao-5s-icon", assets[1])
    ].filter(Boolean).length;

    if (!queued) {
      this.scene.start("HomeScene");
      return;
    }

    this.load.once("complete", () => this.scene.start("HomeScene"));
    this.load.start();
  }

  async findFirstAvailableAsset(candidates) {
    for (const candidate of candidates) {
      const url = getAssetPath(candidate.path);
      if (await this.assetExists(url)) {
        return { ...candidate, url };
      }
    }

    return null;
  }

  queueTexture(key, asset) {
    if (!asset) {
      return false;
    }

    if (asset.type === "svg") {
      this.load.svg(key, asset.url, asset.svgConfig);
      return true;
    }

    this.load.image(key, asset.url);
    return true;
  }

  async assetExists(url) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), ASSET_CHECK_TIMEOUT_MS);

    try {
      let response = await fetch(url, {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal
      });

      if (!response.ok && (response.status === 404 || response.status === 405)) {
        response = await fetch(url, {
          method: "GET",
          cache: "no-store",
          headers: { Range: "bytes=0-0" },
          signal: controller.signal
        });
      }

      return response.ok;
    } catch {
      return false;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
}
