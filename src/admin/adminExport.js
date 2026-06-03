import { toCsvValue } from "../utils.js";

const CSV_HEADERS = [
  "nome",
  "matricula",
  "turno",
  "titulo",
  "area",
  "descricao_local",
  "problema_observado",
  "sugestao_melhoria",
  "senso",
  "status",
  "pontos",
  "resolvida",
  "descricao_resolucao",
  "criado_em"
];

export function exportIdeasCsv(ideas) {
  const rows = ideas.map((idea) => CSV_HEADERS.map((header) => toCsvValue(idea[header])).join(";"));
  const csv = [CSV_HEADERS.join(";"), ...rows].join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `missao-5s-ideias-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
