import { z } from "zod";
import { normalizeText } from "@/lib/text";
import { REQUIRED_SS_COLUMNS } from "./ss-types";

export const topThreeQuerySchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  shift: z.string().trim().optional(),
  team: z.string().trim().optional(),
  ute: z.string().trim().optional(),
  line: z.string().trim().optional(),
  status: z.string().trim().optional(),
  includeCanceled: z.coerce.boolean().default(false),
  includeIntegration: z.coerce.boolean().default(false),
  registeredOnly: z.coerce.boolean().default(false),
  zType: z.enum(["ALL", "Z2", "Z3", "Z4"]).default("ALL")
});

export const operatorSchema = z.object({
  name: z.string().trim().min(3),
  badge: z.string().trim().optional().nullable(),
  shift: z.string().trim().optional().nullable(),
  team: z.string().trim().optional().nullable(),
  ute: z.string().trim().optional().nullable(),
  active: z.boolean().default(true),
  aliases: z.array(z.string().trim().min(2)).default([])
});

export function assertRequiredColumns(headers: string[]) {
  const normalizedHeaders = new Set(headers.map((header) => normalizeText(header)));
  const missing = REQUIRED_SS_COLUMNS.filter(
    (column) => !normalizedHeaders.has(normalizeText(column))
  );

  if (missing.length > 0) {
    throw new Error(`Colunas obrigatorias ausentes: ${missing.join(", ")}`);
  }
}
