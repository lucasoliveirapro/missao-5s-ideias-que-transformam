import { normalizeText } from "./text";

export const UTE_LINE_MAP = {
  UTE_1A: ["TUP", "PAN", "SPJ", "POWERFREE", "PPA", "PPF", "AUC", "AUE"],
  UTE_1B: ["OFD", "OFS", "FDA", "FSA", "SPG", "FPD", "FPS", "SCC", "SCE"],
  UTE_2: [
    "COF",
    "PBP",
    "PPP",
    "PPG",
    "PRS",
    "PRD",
    "PLCD",
    "PLD",
    "PLCS",
    "PLS",
    "PPCD",
    "PPD",
    "PPCS",
    "PPS",
    "SPO"
  ],
  UTE_3: ["TPF"]
} as const;

export type UteKey = keyof typeof UTE_LINE_MAP | "UNKNOWN";

export function extractLineFromLocation(location3: string | null) {
  if (!location3) {
    return null;
  }

  const normalized = normalizeText(location3);
  const match = normalized.match(/^[A-Z0-9]+-([A-Z0-9]+)\b/);
  return match?.[1] ?? null;
}

export function mapLineToUte(line: string | null): UteKey {
  const normalizedLine = normalizeText(line);

  for (const [ute, lines] of Object.entries(UTE_LINE_MAP)) {
    if ((lines as readonly string[]).includes(normalizedLine)) {
      return ute as UteKey;
    }
  }

  return "UNKNOWN";
}
