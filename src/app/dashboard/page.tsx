import { AppShell } from "@/components/layout/AppShell";
import { CardsByDayChart } from "@/components/dashboard/CardsByDayChart";
import { CardsByLineChart } from "@/components/dashboard/CardsByLineChart";
import { CardsByTypeChart } from "@/components/dashboard/CardsByTypeChart";
import { CardsByUteChart } from "@/components/dashboard/CardsByUteChart";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { formatNumber } from "@/lib/number";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: cardsData } = await supabase
    .from("ss_cards")
    .select("*")
    .not("z_type", "is", null)
    .order("created_at_manusis", { ascending: false })
    .limit(5000);
  const cards = cardsData ?? [];

  const z2 = cards.filter((card) => card.z_type === "Z2").length;
  const z3 = cards.filter((card) => card.z_type === "Z3").length;
  const z4 = cards.filter((card) => card.z_type === "Z4").length;
  const closed = cards.filter((card) => card.is_closed_for_operator).length;
  const leader = topBy(cards, "user_name")?.name ?? "-";
  const line = topBy(cards, "line")?.name ?? "-";
  const ute = topBy(cards, "ute_mapped")?.name ?? "-";

  return (
    <AppShell>
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Visao consolidada dos cartoes SS importados.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          <KpiCard label="Cartoes validos" value={formatNumber(cards.length)} />
          <KpiCard label="Z2" value={formatNumber(z2)} />
          <KpiCard label="Z3" value={formatNumber(z3)} />
          <KpiCard label="Z4" value={formatNumber(z4)} />
          <KpiCard label="Fechados" value={formatNumber(closed)} detail="Somente Z2 fechado" />
          <KpiCard label="AM" value={formatNumber(z2 + z3)} detail="Z2 + Z3" />
          <KpiCard label="PM" value={formatNumber(z4)} detail="Z4" />
          <KpiCard label="Condutor lider" value={leader} />
          <KpiCard label="Linha lider" value={line} />
          <KpiCard label="UTE lider" value={ute} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <CardsByDayChart data={groupByDay(cards)} />
          <CardsByTypeChart data={toChartData(countBy(cards, "z_type"))} />
          <CardsByLineChart data={toChartData(countBy(cards, "line")).slice(0, 10)} />
          <CardsByUteChart data={toChartData(countBy(cards, "ute_mapped"))} />
        </div>
      </div>
    </AppShell>
  );
}

function countBy<T extends Record<string, unknown>>(items: T[], key: keyof T) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const label = String(item[key] || "Nao informado");
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
}

function toChartData(values: Record<string, number>) {
  return Object.entries(values)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
}

function topBy<T extends Record<string, unknown>>(items: T[], key: keyof T) {
  return toChartData(countBy(items, key))[0];
}

function groupByDay(items: { created_at_manusis: string | null }[]) {
  return toChartData(
    items.reduce<Record<string, number>>((acc, item) => {
      const name = item.created_at_manusis?.slice(0, 10) || "Sem data";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-30);
}
