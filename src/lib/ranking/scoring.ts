import type { TopThreeItem } from "@/types/ranking";

export function compareRankingItems(a: TopThreeItem, b: TopThreeItem) {
  return (
    b.totalCards - a.totalCards ||
    b.amTotal - a.amTotal ||
    b.z2Count - a.z2Count ||
    b.z3Count - a.z3Count ||
    b.z4Count - a.z4Count ||
    a.operatorName.localeCompare(b.operatorName, "pt-BR")
  );
}

export function closureRate(z2Count: number, closedTotal: number) {
  if (z2Count === 0) {
    return 0;
  }

  return Number(((closedTotal / z2Count) * 100).toFixed(1));
}
