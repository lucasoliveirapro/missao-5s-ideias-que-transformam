export function sanitizeFileName(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${base || "arquivo"}.${extension}`;
}

export function safeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Ocorreu um erro ao processar a solicitacao.";
}
