"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#047857", "#2563eb", "#d97706", "#7c3aed", "#64748b"];

export function CardsByUteChart({
  data
}: {
  data: { name: string; total: number }[];
}) {
  return (
    <div className="h-72 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-950">Cartoes por UTE</h2>
      <ResponsiveContainer height="90%" width="100%">
        <PieChart>
          <Pie data={data} dataKey="total" nameKey="name" outerRadius={90}>
            {data.map((entry, index) => (
              <Cell fill={COLORS[index % COLORS.length]} key={entry.name} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
