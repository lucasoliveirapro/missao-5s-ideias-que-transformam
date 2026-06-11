import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { PhotoUploader } from "./PhotoUploader";

type OperatorRow = {
  id: string;
  name: string;
  badge: string | null;
  shift: string | null;
  team: string | null;
  ute: string | null;
  active: boolean;
  operator_aliases?: { alias: string }[];
};

export function OperatorsTable({ operators }: { operators: OperatorRow[] }) {
  return (
    <Table
      columns={["Nome", "Matricula", "Turno", "Equipe", "UTE", "Aliases", "Status", "Foto"]}
      rows={operators.map((operator) => [
        operator.name,
        operator.badge ?? "-",
        operator.shift ?? "-",
        operator.team ?? "-",
        operator.ute ?? "-",
        operator.operator_aliases?.map((item) => item.alias).join(", ") || "-",
        <Badge key="status" tone={operator.active ? "green" : "neutral"}>
          {operator.active ? "Ativo" : "Inativo"}
        </Badge>,
        <PhotoUploader key="photo" operatorId={operator.id} />
      ])}
    />
  );
}
