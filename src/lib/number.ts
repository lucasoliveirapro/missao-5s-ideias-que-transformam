export function formatNumber(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("pt-BR");
}

export function formatPercent(value: number | null | undefined) {
  return `${Number(value ?? 0).toLocaleString("pt-BR", {
    maximumFractionDigits: 1
  })}%`;
}
