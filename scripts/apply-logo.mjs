import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const imagesDir = path.join(root, "public", "assets", "images");

const MIN_LOGO = { width: 1440, height: 480 };
const MIN_ICON = { width: 512, height: 512 };

function usage() {
  console.log("Uso:");
  console.log("  npm run logo:apply -- caminho/para/logo.svg");
  console.log("  npm run logo:apply -- caminho/para/logo.png caminho/para/icone.png");
}

function extensionOf(filePath) {
  return path.extname(filePath).toLowerCase();
}

function ensureSupportedImage(filePath) {
  const ext = extensionOf(filePath);
  if (![".svg", ".png"].includes(ext)) {
    throw new Error(`Formato nao suportado: ${ext || "sem extensao"}. Use SVG ou PNG.`);
  }
  return ext;
}

function pngDimensions(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    throw new Error("PNG invalido.");
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

async function describeImage(filePath, minimum) {
  const ext = ensureSupportedImage(filePath);
  const buffer = await readFile(filePath);

  if (ext === ".svg") {
    const text = buffer.toString("utf8");
    if (!text.includes("<svg")) {
      throw new Error("SVG invalido: tag <svg> nao encontrada.");
    }
    return { ext, warning: "" };
  }

  const size = pngDimensions(buffer);
  const warning = size.width < minimum.width || size.height < minimum.height
    ? `Aviso: PNG ${size.width}x${size.height}; recomendado minimo ${minimum.width}x${minimum.height} para evitar blur.`
    : "";
  return { ext, warning };
}

async function applyAsset(sourcePath, outputBaseName, minimum) {
  const absoluteSource = path.resolve(sourcePath);
  const details = await describeImage(absoluteSource, minimum);
  await mkdir(imagesDir, { recursive: true });

  const target = path.join(imagesDir, `${outputBaseName}${details.ext}`);
  await copyFile(absoluteSource, target);

  console.log(`Logo aplicada: ${path.relative(root, target)}`);
  if (details.warning) {
    console.warn(details.warning);
  }
}

const [, , logoPath, iconPath] = process.argv;

if (!logoPath) {
  usage();
  process.exitCode = 1;
} else {
  await applyAsset(logoPath, "logo-missao-5s", MIN_LOGO);

  if (iconPath) {
    await applyAsset(iconPath, "logo-missao-5s-icon", MIN_ICON);
  }
}
