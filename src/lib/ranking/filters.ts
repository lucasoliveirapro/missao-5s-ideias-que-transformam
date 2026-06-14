import { currentMonthRange } from "@/lib/date";
import { topThreeQuerySchema } from "@/lib/manusis/validators";

export function parseTopThreeFilters(searchParams: URLSearchParams) {
  const defaults = currentMonthRange();
  const parsed = topThreeQuerySchema.parse({
    startDate: searchParams.get("startDate") || defaults.startDate,
    endDate: searchParams.get("endDate") || defaults.endDate,
    shift: searchParams.get("shift") || undefined,
    team: searchParams.get("team") || undefined,
    ute: searchParams.get("ute") || undefined,
    line: searchParams.get("line") || undefined,
    status: searchParams.get("status") || undefined,
    includeCanceled: searchParams.get("includeCanceled") ?? false,
    includeIntegration: searchParams.get("includeIntegration") ?? false,
    registeredOnly: searchParams.get("registeredOnly") ?? false,
    zType: searchParams.get("zType") || "ALL"
  });

  return {
    ...parsed,
    startDate: parsed.startDate ?? defaults.startDate,
    endDate: parsed.endDate ?? defaults.endDate
  };
}
