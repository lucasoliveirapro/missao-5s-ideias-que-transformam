import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RankingTable } from "@/components/ranking/RankingTable";
import { TopThreeFilters } from "@/components/ranking/TopThreeFilters";
import { TopThreePodium } from "@/components/ranking/TopThreePodium";
import { currentMonthRange } from "@/lib/date";
import { formatNumber } from "@/lib/number";
import { parseTopThreeFilters } from "@/lib/ranking/filters";
import { getTopThreeRanking } from "@/lib/ranking/top3";
import { toUrlSearchParams, type PageSearchParams } from "@/lib/search-params";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TopThreePage({
  searchParams
}: {
  searchParams: PageSearchParams;
}) {
  const urlParams = await toUrlSearchParams(searchParams);
  const filters = parseTopThreeFilters(urlParams);
  const defaults = currentMonthRange();
  let ranking = null;
  let error = null;

  try {
    const supabase = await createServerSupabaseClient();
    ranking = await getTopThreeRanking(supabase, filters, async (path) => {
      const { data } = await supabase.storage.from("operator-photos").createSignedUrl(path, 600);
      return data?.signedUrl ?? null;
    });
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Nao foi possivel carregar o Top 3.";
  }

  return (
    <AppShell>
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Top 3 Condutores - Cartoes AM/PM</h1>
          <p className="mt-1 text-sm text-slate-600">Z2 = Cartao AM | Z3 = Fonte de sujeira | Z4 = PM</p>
        </div>

        <Suspense>
          <TopThreeFilters defaults={defaults} />
        </Suspense>
        {error ? <ErrorState message={error} /> : null}

        {ranking ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <KpiCard label="Total geral" value={formatNumber(ranking.summary.totalCards)} />
              <KpiCard label="Cartoes AM" value={formatNumber(ranking.summary.amTotal)} detail="Z2 + Z3" />
              <KpiCard label="Cartoes PM" value={formatNumber(ranking.summary.pmTotal)} detail="Z4" />
            </div>
            <TopThreePodium items={ranking.items} />
            <Card>
              <CardHeader title="Detalhamento do Top 3" />
              <RankingTable items={ranking.items} />
            </Card>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
