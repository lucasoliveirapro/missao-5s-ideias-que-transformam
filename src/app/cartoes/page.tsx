import { AppShell } from "@/components/layout/AppShell";
import { CardsFilters } from "@/components/cards/CardsFilters";
import { CardsTable } from "@/components/cards/CardsTable";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { currentMonthRange, endOfDayIso } from "@/lib/date";
import { toUrlSearchParams, type PageSearchParams } from "@/lib/search-params";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CartoesPage({
  searchParams
}: {
  searchParams: PageSearchParams;
}) {
  const params = await toUrlSearchParams(searchParams);
  const defaults = currentMonthRange();
  const startDate = params.get("startDate") || defaults.startDate;
  const endDate = params.get("endDate") || defaults.endDate;
  const user = params.get("user");
  const zType = params.get("zType");
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("ss_cards")
    .select("*")
    .gte("created_at_manusis", startDate)
    .lte("created_at_manusis", endOfDayIso(endDate))
    .order("created_at_manusis", { ascending: false })
    .limit(100);

  if (user) {
    query = query.ilike("user_name", `%${user}%`);
  }

  if (zType) {
    query = query.eq("z_type", zType as "Z2" | "Z3" | "Z4");
  }

  const { data: cardsData } = await query;
  const cards = cardsData ?? [];

  return (
    <AppShell>
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Cartoes SS</h1>
          <p className="mt-1 text-sm text-slate-600">Consulta paginavel dos ultimos 100 cartoes filtrados.</p>
        </div>
        <CardsFilters defaults={{ startDate, endDate }} />
        <Card>
          <CardHeader title="Resultado" description="Use filtros para reduzir o periodo antes de investigar." />
          {cards.length > 0 ? (
            <CardsTable cards={cards} />
          ) : (
            <EmptyState title="Sem cartoes" description="Importe a base SS ou ajuste os filtros." />
          )}
        </Card>
      </div>
    </AppShell>
  );
}
