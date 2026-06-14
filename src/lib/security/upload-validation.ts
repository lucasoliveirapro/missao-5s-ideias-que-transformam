import { z } from "zod";
import { sanitizeFileName } from "./sanitize";

const XLSX_MAGIC = [0x50, 0x4b, 0x03, 0x04];

export const xlsxUploadSchema = z.object({
  name: z.string().min(1),
  size: z.number().positive()
});

export const operatorPhotoSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z.number().positive().max(photoMaxBytes())
});

export function uploadMaxBytes() {
  return Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 15) * 1024 * 1024;
}

export function uploadMaxRows() {
  return Number(process.env.UPLOAD_MAX_ROWS || 100000);
}

export function photoMaxBytes() {
  return Number(process.env.OPERATOR_PHOTO_MAX_SIZE_MB || 2) * 1024 * 1024;
}

export function validateXlsxFileMeta(file: File) {
  const result = xlsxUploadSchema.safeParse({
    name: file.name,
    size: file.size
  });

  if (!result.success) {
    throw new Error("Arquivo XLSX invalido.");
  }

  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith(".xlsx") || /\.(xlsm|xls|csv|exe|zip)$/i.test(lowerName)) {
    throw new Error("Envie apenas arquivos .xlsx exportados do Manusis4.");
  }

  if (file.size > uploadMaxBytes()) {
    throw new Error("Arquivo acima do limite permitido.");
  }
}

export function validateXlsxMagicBytes(buffer: Buffer) {
  const ok = XLSX_MAGIC.every((byte, index) => buffer[index] === byte);
  if (!ok) {
    throw new Error("A estrutura do XLSX nao foi reconhecida.");
  }
}

export function validateOperatorPhotoMeta(input: unknown) {
  const parsed = operatorPhotoSchema.parse(input);
  const fileName = sanitizeFileName(parsed.fileName);
  const extension = fileName.split(".").pop()?.toLowerCase();
  const allowedExtensions = new Set(["jpg", "jpeg", "png", "webp"]);

  if (!extension || !allowedExtensions.has(extension)) {
    throw new Error("Fotos devem ser JPEG, PNG ou WebP.");
  }

  if (parsed.contentType === "image/jpeg" && !["jpg", "jpeg"].includes(extension)) {
    throw new Error("Extensao e tipo de imagem nao conferem.");
  }

  if (parsed.contentType === "image/png" && extension !== "png") {
    throw new Error("Extensao e tipo de imagem nao conferem.");
  }

  if (parsed.contentType === "image/webp" && extension !== "webp") {
    throw new Error("Extensao e tipo de imagem nao conferem.");
  }

  return { ...parsed, fileName };
}
