import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { RankingTable } from "@/components/ranking/RankingTable";
import { currentMonthRange } from "@/lib/date";
import { parseTopThreeFilters } from "@/lib/ranking/filters";
import { getTopThreeRanking } from "@/lib/ranking/top3";
import { toUrlSearchParams, type PageSearchParams } from "@/lib/search-params";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TopThreeFilters } from "@/components/ranking/TopThreeFilters";

export const dynamic = "force-dynamic";

export default async function RankingGeralPage({
  searchParams
}: {
  searchParams: PageSearchParams;
}) {
  const filters = parseTopThreeFilters(await toUrlSearchParams(searchParams));
  const defaults = currentMonthRange();
  let ranking = null;
  let error = null;

  try {
    const supabase = await createServerSupabaseClient();
    ranking = await getTopThreeRanking(supabase, filters, undefined, 50);
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Nao foi possivel carregar o ranking.";
  }

  return (
    <AppShell>
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Ranking geral</h1>
          <p className="mt-1 text-sm text-slate-600">Lista ordenada pelos criterios de desempate do Top 3.</p>
        </div>
        <Suspense>
          <TopThreeFilters defaults={defaults} />
        </Suspense>
        {error ? <ErrorState message={error} /> : null}
        {ranking ? (
          <Card>
            <CardHeader title="Condutores" description="Ate 50 condutores no periodo filtrado." />
            <RankingTable items={ranking.items} />
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
