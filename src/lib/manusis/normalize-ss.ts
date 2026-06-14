import type { ZCardType } from "@/types/database";
import type { NormalizedSsCard } from "@/types/ss-card";
import { cleanText, normalizeText } from "@/lib/text";
import { extractLineFromLocation, mapLineToUte } from "@/lib/ute";
import type { RawSsRow } from "./ss-types";

const CLOSED_STATUS_MARKERS = [
  "FECHADO",
  "FECHADA",
  "CONCLUIDO",
  "CONCLUIDA",
  "ENCERRADO",
  "ENCERRADA",
  "FINALIZADO",
  "FINALIZADA"
];

const TRUE_MARKERS = new Set(["SIM", "S", "TRUE", "1", "YES"]);
const FALSE_MARKERS = new Set(["NAO", "NÃO", "N", "FALSE", "0", "NO"]);

const COLUMN_ALIASES: Record<string, string[]> = {
  ss_number: ["Numero", "Número"],
  status: ["Status"],
  company: ["Empresa"],
  unit: ["Unidade"],
  location_1: ["Localizacao 1", "Localização 1"],
  location_2: ["Localizacao 2", "Localização 2"],
  location_3: ["Localizacao 3", "Localização 3"],
  location_4: ["Localizacao 4", "Localização 4"],
  asset: ["Ativo"],
  requester_name: ["Solicitante"],
  requester_email: ["Email solicitante"],
  main_subject: ["Assunto principal"],
  secondary_subject: ["Assunto secundario", "Assunto secundário"],
  description: ["Solicitacao", "Solicitação"],
  machine_stopped: ["Maquina parada?", "Máquina parada?"],
  safety_item: ["Item de seguranca", "Item de segurança"],
  user_name: ["Usuario", "Usuário"],
  created_at: ["Data criacao", "Data criação"],
  classification: ["Classificacao", "Classificação"],
  safety: ["Seguranca", "Segurança"],
  production: ["Producao", "Produção"],
  quality: ["Qualidade"],
  environment: ["Meio ambiente"],
  cost_center: ["Centro de custo"],
  work_center: ["Centro de trabalho"],
  has_wcm_tag: ["Tem etiqueta WCM"],
  wcm_pillar: ["Pilar WCM"],
  om_number: ["Numero da OM", "Número da OM"],
  om_status: ["Status da OM"],
  om_service_type: ["Tipo de servico da OM", "Tipo de serviço da OM"],
  om_service_nature: ["Natureza de servico da OM", "Natureza de serviço da OM"],
  om_opened_at: ["Data abertura da OM"],
  om_description: ["Descricao da OM", "Descrição da OM"],
  om_closed_at: ["OM fechada em"]
};

export function extractZType(mainSubject: string | null): ZCardType | null {
  if (!mainSubject) {
    return null;
  }

  const normalized = mainSubject.trim().toUpperCase();
  if (normalized.startsWith("Z2")) return "Z2";
  if (normalized.startsWith("Z3")) return "Z3";
  if (normalized.startsWith("Z4")) return "Z4";
  return null;
}

export function isClosedForOperator(card: {
  z_type: ZCardType | null;
  status: string | null;
  om_status: string | null;
  om_closed_at: string | null;
}) {
  if (card.z_type !== "Z2") {
    return false;
  }

  if (card.om_closed_at) {
    return true;
  }

  return [card.status, card.om_status].some((value) => {
    const normalized = normalizeText(value);
    return CLOSED_STATUS_MARKERS.some((marker) => normalized.includes(marker));
  });
}

export function normalizeSsRow(row: RawSsRow): NormalizedSsCard {
  const location3 = getText(row, "location_3");
  const line = extractLineFromLocation(location3);
  const mainSubject = getText(row, "main_subject");
  const zType = extractZType(mainSubject);
  const status = getText(row, "status");
  const omStatus = getText(row, "om_status");
  const omClosedAt = getDate(row, "om_closed_at");

  const card: NormalizedSsCard = {
    ss_number: getText(row, "ss_number") ?? "",
    status,
    company: getText(row, "company"),
    unit: getText(row, "unit"),
    location_1: getText(row, "location_1"),
    location_2: getText(row, "location_2"),
    location_3: location3,
    location_4: getText(row, "location_4"),
    line,
    operation: getText(row, "location_4"),
    ute_mapped: mapLineToUte(line),
    asset: getText(row, "asset"),
    requester_name: getText(row, "requester_name"),
    requester_email: getText(row, "requester_email"),
    user_name: getText(row, "user_name"),
    main_subject: mainSubject,
    secondary_subject: getText(row, "secondary_subject"),
    z_type: zType,
    description: getText(row, "description"),
    machine_stopped: getBoolean(row, "machine_stopped"),
    safety_item: getBoolean(row, "safety_item"),
    created_at: getDate(row, "created_at"),
    classification: getText(row, "classification"),
    safety: getText(row, "safety"),
    production: getText(row, "production"),
    quality: getText(row, "quality"),
    environment: getText(row, "environment"),
    cost_center: getText(row, "cost_center"),
    work_center: getText(row, "work_center"),
    has_wcm_tag: getBoolean(row, "has_wcm_tag"),
    wcm_pillar: getText(row, "wcm_pillar"),
    om_number: getText(row, "om_number"),
    om_status: omStatus,
    om_service_type: getText(row, "om_service_type"),
    om_service_nature: getText(row, "om_service_nature"),
    om_opened_at: getDate(row, "om_opened_at"),
    om_description: getText(row, "om_description"),
    om_closed_at: omClosedAt,
    is_closed_for_operator: false,
    raw_data: row
  };

  card.is_closed_for_operator = isClosedForOperator(card);

  return card;
}

function getByAlias(row: RawSsRow, key: string) {
  const aliases = COLUMN_ALIASES[key] ?? [key];
  const normalizedLookup = new Map(
    Object.entries(row).map(([rawKey, value]) => [normalizeText(rawKey), value])
  );

  for (const alias of aliases) {
    const value = normalizedLookup.get(normalizeText(alias));
    if (value !== undefined) {
      return value;
    }
  }

  return null;
}

function getText(row: RawSsRow, key: string) {
  return cleanText(getByAlias(row, key));
}

function getBoolean(row: RawSsRow, key: string) {
  const value = getByAlias(row, key);
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = normalizeText(value);
  if (TRUE_MARKERS.has(normalized)) return true;
  if (FALSE_MARKERS.has(normalized)) return false;
  return null;
}

function getDate(row: RawSsRow, key: string) {
  const value = getByAlias(row, key);
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    excelEpoch.setUTCDate(excelEpoch.getUTCDate() + value);
    return excelEpoch.toISOString();
  }

  const text = String(value).trim();
  const brMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (brMatch) {
    const [, day, month, year, hour = "0", minute = "0", second = "0"] = brMatch;
    return new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      )
    ).toISOString();
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
