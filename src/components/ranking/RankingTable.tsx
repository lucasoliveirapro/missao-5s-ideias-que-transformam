import type { TopThreeItem } from "@/types/ranking";
import { Table } from "@/components/ui/Table";
import { formatPercent } from "@/lib/number";

export function RankingTable({ items }: { items: TopThreeItem[] }) {
  return (
    <Table
      columns={[
        "Posicao",
        "Condutor",
        "Matricula",
        "Turno",
        "Equipe",
        "UTE",
        "Z2",
        "Z3",
        "Z4",
        "AM",
        "PM",
        "Total",
        "Fechados",
        "% Z2 fechado"
      ]}
      rows={items.map((item) => [
        item.position,
        item.operatorName,
        item.badge ?? "-",
        item.shift ?? "-",
        item.team ?? "-",
        item.ute ?? "-",
        item.z2Count,
        item.z3Count,
        item.z4Count,
        item.amTotal,
        item.pmTotal,
        item.totalCards,
        item.closedTotal,
        formatPercent(item.closureRate)
      ])}
    />
  );
}
