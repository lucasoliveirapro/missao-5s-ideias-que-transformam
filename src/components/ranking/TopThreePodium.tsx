import type { TopThreeItem } from "@/types/ranking";
import { EmptyState } from "@/components/ui/EmptyState";
import { PodiumCard } from "./PodiumCard";

export function TopThreePodium({ items }: { items: TopThreeItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Sem dados no periodo"
        description="Importe uma base SS ou ajuste os filtros para visualizar os condutores."
      />
    );
  }

  const first = items.find((item) => item.position === 1);
  const second = items.find((item) => item.position === 2);
  const third = items.find((item) => item.position === 3);

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
      <div className="lg:order-1">{second ? <PodiumCard item={second} /> : null}</div>
      <div className="lg:order-2">{first ? <PodiumCard item={first} /> : null}</div>
      <div className="lg:order-3">{third ? <PodiumCard item={third} /> : null}</div>
    </div>
  );
}
