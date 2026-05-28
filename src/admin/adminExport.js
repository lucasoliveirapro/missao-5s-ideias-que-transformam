const CSV_COLUMNS = [
  ["nome", "nome"],
  ["matricula", "matrícula"],
  ["turno", "turno"],
  ["titulo", "título"],
  ["descricao", "descrição"],
  ["senso", "senso"],
  ["area", "área"],
  ["status", "status"],
  ["pontos", "pontos"],
  ["fotoUrl", "fotoUrl"],
  ["dataHora", "dataHora"]
];

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r;]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function exportIdeasCsv(ideas) {
  const rows = [
    CSV_COLUMNS.map(([, label]) => csvEscape(label)).join(";"),
    ...ideas.map((idea) => CSV_COLUMNS.map(([key]) => csvEscape(idea[key])).join(";"))
  ];

  const blob = new Blob([`\uFEFF${rows.join("\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `missao-5s-ideias-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
