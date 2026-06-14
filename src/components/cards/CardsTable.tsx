import type { Database } from "@/types/database";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { formatBrDate } from "@/lib/date";

type CardRow = Database["public"]["Tables"]["ss_cards"]["Row"];

export function CardsTable({ cards }: { cards: CardRow[] }) {
  return (
    <Table
      columns={[
        "SS",
        "Data",
        "Status",
        "Usuario",
        "Solicitante",
        "Tipo",
        "Linha",
        "UTE",
        "Ativo",
        "Descricao",
        "OM",
        "Status OM",
        "OM fechada"
      ]}
      rows={cards.map((card) => [
        card.ss_number,
        formatBrDate(card.created_at_manusis),
        card.status ?? "-",
        card.user_name ?? "-",
        card.requester_name ?? "-",
        <Badge key="type" tone={card.z_type === "Z4" ? "amber" : "green"}>
          {card.z_type ?? "-"}
        </Badge>,
        card.line ?? "-",
        card.ute_mapped ?? "-",
        card.asset ?? "-",
        <span className="line-clamp-2 max-w-md" key="description">
          {card.description ?? "-"}
        </span>,
        card.om_number ?? "-",
        card.om_status ?? "-",
        formatBrDate(card.om_closed_at)
      ])}
    />
  );
}
