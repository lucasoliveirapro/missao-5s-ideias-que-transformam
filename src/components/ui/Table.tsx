export function Table({
  columns,
  rows
}: {
  columns: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-600"
                key={column}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr className="odd:bg-white even:bg-slate-50/60" key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td className="border-b border-slate-100 px-4 py-3 text-slate-800" key={cellIndex}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
