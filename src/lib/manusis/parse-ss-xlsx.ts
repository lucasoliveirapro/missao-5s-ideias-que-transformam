import * as XLSX from "xlsx";
import { uploadMaxRows } from "@/lib/security/upload-validation";
import type { RawSsRow } from "./ss-types";
import { assertRequiredColumns } from "./validators";

const SHEET_NAME = "Solicitações";

export function parseSsXlsx(buffer: Buffer) {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    dense: false
  });

  const sheetName =
    workbook.SheetNames.find((name) => name === SHEET_NAME) ??
    workbook.SheetNames.find((name) => name.normalize("NFD").replace(/\p{Diacritic}/gu, "") === "Solicitacoes");

  if (!sheetName) {
    throw new Error('A aba "Solicitações" nao foi encontrada.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<RawSsRow>(sheet, {
    defval: null,
    raw: false
  });

  if (rows.length > uploadMaxRows()) {
    throw new Error("Arquivo acima do limite de linhas permitido.");
  }

  const headers = Object.keys(rows[0] ?? {});
  assertRequiredColumns(headers);

  return rows;
}
