import type { ZCardType } from "@/types/database";

export const REQUIRED_SS_COLUMNS = [
  "Numero",
  "Status",
  "Assunto principal",
  "Usuario",
  "Data criacao"
] as const;

export type RawSsRow = Record<string, unknown>;

export type ImportCounters = {
  totalRows: number;
  validCards: number;
  ignoredRows: number;
  errorRows: number;
  duplicateOrUpdated: number;
  z2: number;
  z3: number;
  z4: number;
  minCreatedAt: string | null;
  maxCreatedAt: string | null;
};

export const Z_TYPES: ZCardType[] = ["Z2", "Z3", "Z4"];
