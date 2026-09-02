"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrencyBRL } from "@/lib/utils";

export function RevenueChart({ data }: { data: { month: string; value: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={70}
            tickFormatter={(v) => formatCurrencyBRL(v).replace(",00", "")}
          />
          <Tooltip
            formatter={(value) => formatCurrencyBRL(typeof value === "number" ? value : Number(value))}
            cursor={{ fill: "hsl(var(--muted))" }}
          />
          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
