import { Badge } from "@/components/ui/Badge";
import { formatNumber } from "@/lib/number";

type ImportResult = {
  batchId: string;
  fileName: string;
  totalRows: number;
  validCards: number;
  ignoredRows: number;
  errorRows: number;
  duplicateOrUpdated: number;
  z2: number;
  z3: number;
  z4: number;
  minCreatedAt: string | null;
  maxCreatedAt: string | null;
};

export function ImportSummary({ files }: { files: ImportResult[] }) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3">
      {files.map((file) => (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={file.batchId}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-950">{file.fileName}</h3>
              <p className="text-sm text-slate-600">Lote {file.batchId}</p>
            </div>
            <Badge tone={file.errorRows > 0 ? "amber" : "green"}>Importado</Badge>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
            <SummaryItem label="Linhas lidas" value={file.totalRows} />
            <SummaryItem label="Cartoes validos" value={file.validCards} />
            <SummaryItem label="Ignorados" value={file.ignoredRows} />
            <SummaryItem label="Erros" value={file.errorRows} />
            <SummaryItem label="Z2" value={file.z2} />
            <SummaryItem label="Z3" value={file.z3} />
            <SummaryItem label="Z4" value={file.z4} />
            <SummaryItem label="Duplicados/atualizados" value={file.duplicateOrUpdated} />
          </dl>
        </div>
      ))}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-950">
        {typeof value === "number" ? formatNumber(value) : value}
      </dd>
    </div>
  );
}
