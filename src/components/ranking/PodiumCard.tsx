/* eslint-disable @next/next/no-img-element */
import { Trophy } from "lucide-react";
import type { TopThreeItem } from "@/types/ranking";
import { initials } from "@/lib/text";
import { formatPercent } from "@/lib/number";
import { Badge } from "@/components/ui/Badge";
import { PodiumMetric } from "./PodiumMetric";

const positionStyles = {
  1: "border-emerald-400 bg-white shadow-lg lg:-mt-8",
  2: "border-slate-300 bg-white",
  3: "border-amber-300 bg-white"
};

export function PodiumCard({ item }: { item: TopThreeItem }) {
  return (
    <article
      className={`rounded-lg border p-5 ${positionStyles[item.position as 1 | 2 | 3] ?? "border-slate-200 bg-white"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {item.photoUrl ? (
            <img
              alt={`Foto de ${item.operatorName}`}
              className="size-20 rounded-full border-4 border-slate-100 object-cover"
              src={item.photoUrl}
            />
          ) : (
            <div className="grid size-20 place-items-center rounded-full border-4 border-slate-100 bg-slate-200 text-xl font-bold text-slate-700">
              {initials(item.operatorName)}
            </div>
          )}
          <div>
            <Badge tone={item.position === 1 ? "green" : item.position === 2 ? "blue" : "amber"}>
              {item.position}o lugar
            </Badge>
            <h3 className="mt-2 text-xl font-bold text-slate-950">{item.operatorName}</h3>
            <p className="text-sm text-slate-600">
              {[item.badge, item.shift, item.team, item.ute].filter(Boolean).join(" | ") ||
                "Sem cadastro complementar"}
            </p>
          </div>
        </div>
        <Trophy className="size-7 text-emerald-700" aria-hidden="true" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <PodiumMetric emphasized label="Total" value={item.totalCards} />
        <PodiumMetric label="Fechados" value={item.closedTotal} />
        <PodiumMetric label="AM" value={item.amTotal} />
        <PodiumMetric label="PM" value={item.pmTotal} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <PodiumMetric label="Z2" value={item.z2Count} />
        <PodiumMetric label="Z3" value={item.z3Count} />
        <PodiumMetric label="Z4" value={item.z4Count} />
      </div>

      <p className="mt-4 text-sm font-medium text-slate-600">
        Fechamento Z2: <span className="text-slate-950">{formatPercent(item.closureRate)}</span>
      </p>
    </article>
  );
}
