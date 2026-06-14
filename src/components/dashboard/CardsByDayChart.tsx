"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function CardsByDayChart({
  data
}: {
  data: { name: string; total: number }[];
}) {
  return (
    <div className="h-72 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
      <h2 className="text-sm font-semibold text-slate-950">Cartoes por dia</h2>
      <ResponsiveContainer height="90%" width="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line dataKey="total" stroke="#047857" strokeWidth={3} type="monotone" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
