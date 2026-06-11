import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { TopThreeResponse } from "@/types/ranking";
import { endOfDayIso } from "@/lib/date";
import { normalizeText } from "@/lib/text";
import { compareRankingItems, closureRate } from "./scoring";

type EnrichedCard = Database["public"]["Views"]["v_ss_cards_enriched"]["Row"];

type TopThreeFilterInput = {
  startDate: string;
  endDate: string;
  shift?: string;
  team?: string;
  ute?: string;
  line?: string;
  status?: string;
  includeCanceled: boolean;
  includeIntegration: boolean;
  registeredOnly: boolean;
  zType?: "ALL" | "Z2" | "Z3" | "Z4";
};

const INTEGRATION_USERS = new Set(["INTEGRACAO", "INTEGRACAO MANUSIS", "PXBREMOTE"]);

export async function getTopThreeRanking(
  supabase: SupabaseClient<Database>,
  filters: TopThreeFilterInput,
  getPhotoUrl?: (path: string) => Promise<string | null>,
  limit = 3
): Promise<TopThreeResponse> {
  const rows = await fetchRankingRows(supabase, filters);
  const uniqueRows = dedupeBySsNumber(rows);
  const filteredRows = uniqueRows.filter((row) => shouldIncludeRow(row, filters));
  const grouped = new Map<string, ReturnType<typeof createAccumulator>>();

  for (const row of filteredRows) {
    const userName = row.operator_name || row.user_name || "Nao informado";
    const key = row.operator_id ?? normalizeText(userName);
    const current =
      grouped.get(key) ??
      createAccumulator({
        operatorId: row.operator_id,
        operatorName: userName,
        badge: row.operator_badge,
        shift: row.operator_shift,
        team: row.operator_team,
        ute: row.operator_ute ?? row.ute_mapped,
        photoPath: row.operator_photo_path
      });

    if (row.z_type === "Z2") current.z2Count += 1;
    if (row.z_type === "Z3") current.z3Count += 1;
    if (row.z_type === "Z4") current.z4Count += 1;
    if (row.is_closed_for_operator) current.closedTotal += 1;

    grouped.set(key, current);
  }

  const items = await Promise.all(
    [...grouped.values()].map(async (item) => {
      const amTotal = item.z2Count + item.z3Count;
      const pmTotal = item.z4Count;
      const totalCards = amTotal + pmTotal;

      return {
        position: 0,
        operatorId: item.operatorId,
        operatorName: item.operatorName,
        badge: item.badge,
        shift: item.shift,
        team: item.team,
        ute: item.ute,
        photoUrl: item.photoPath && getPhotoUrl ? await getPhotoUrl(item.photoPath) : null,
        z2Count: item.z2Count,
        z3Count: item.z3Count,
        z4Count: item.z4Count,
        amTotal,
        pmTotal,
        totalCards,
        closedTotal: item.closedTotal,
        closureRate: closureRate(item.z2Count, item.closedTotal)
      };
    })
  );

  const sorted = items.sort(compareRankingItems).slice(0, limit);
  sorted.forEach((item, index) => {
    item.position = index + 1;
  });

  const summary = filteredRows.reduce(
    (acc, row) => {
      if (row.z_type === "Z2") acc.z2Total += 1;
      if (row.z_type === "Z3") acc.z3Total += 1;
      if (row.z_type === "Z4") acc.z4Total += 1;
      return acc;
    },
    { totalCards: 0, z2Total: 0, z3Total: 0, z4Total: 0, amTotal: 0, pmTotal: 0 }
  );

  summary.amTotal = summary.z2Total + summary.z3Total;
  summary.pmTotal = summary.z4Total;
  summary.totalCards = summary.amTotal + summary.pmTotal;

  return {
    period: {
      startDate: filters.startDate,
      endDate: filters.endDate
    },
    items: sorted,
    summary
  };
}

async function fetchRankingRows(
  supabase: SupabaseClient<Database>,
  filters: TopThreeFilterInput
) {
  const pageSize = 1000;
  const rows: EnrichedCard[] = [];

  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from("v_ss_cards_enriched")
      .select(
        "ss_number,status,user_name,z_type,is_closed_for_operator,created_at_manusis,line,ute_mapped,operator_id,operator_name,operator_badge,operator_shift,operator_team,operator_ute,operator_photo_path,has_registered_operator"
      )
      .gte("created_at_manusis", filters.startDate)
      .lte("created_at_manusis", endOfDayIso(filters.endDate))
      .not("z_type", "is", null)
      .range(from, from + pageSize - 1);

    if (filters.zType && filters.zType !== "ALL") {
      query = query.eq("z_type", filters.zType);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    rows.push(...((data ?? []) as EnrichedCard[]));

    if (!data || data.length < pageSize) {
      break;
    }
  }

  return rows;
}

function dedupeBySsNumber(rows: EnrichedCard[]) {
  const byNumber = new Map<string, EnrichedCard>();

  for (const row of rows) {
    if (row.ss_number && !byNumber.has(row.ss_number)) {
      byNumber.set(row.ss_number, row);
    }
  }

  return [...byNumber.values()];
}

function shouldIncludeRow(row: EnrichedCard, filters: TopThreeFilterInput) {
  const user = normalizeText(row.user_name);
  const status = normalizeText(row.status);

  if (!row.user_name?.trim()) return false;
  if (!filters.includeCanceled && status.includes("CANCEL")) return false;
  if (!filters.includeIntegration && INTEGRATION_USERS.has(user)) return false;
  if (filters.registeredOnly && !row.has_registered_operator) return false;
  if (filters.shift && normalizeText(row.operator_shift) !== normalizeText(filters.shift)) return false;
  if (filters.team && normalizeText(row.operator_team) !== normalizeText(filters.team)) return false;
  if (filters.ute) {
    const cardUte = normalizeText(row.ute_mapped);
    const operatorUte = normalizeText(row.operator_ute);
    if (cardUte !== normalizeText(filters.ute) && operatorUte !== normalizeText(filters.ute)) {
      return false;
    }
  }
  if (filters.line && normalizeText(row.line) !== normalizeText(filters.line)) return false;
  if (filters.status && normalizeText(row.status) !== normalizeText(filters.status)) return false;

  return true;
}

function createAccumulator(input: {
  operatorId: string | null;
  operatorName: string;
  badge: string | null;
  shift: string | null;
  team: string | null;
  ute: string | null;
  photoPath: string | null;
}) {
  return {
    ...input,
    z2Count: 0,
    z3Count: 0,
    z4Count: 0,
    closedTotal: 0
  };
}
