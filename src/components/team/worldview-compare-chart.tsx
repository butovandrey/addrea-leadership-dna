"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TeamWorldviewStat } from "@/types/survey";

type Props = {
  worldviews: TeamWorldviewStat[];
};

export function WorldviewCompareChart({ worldviews }: Props) {
  const data = worldviews.map((w) => ({
    name: w.label.replace("Компания как ", ""),
    preferred: Math.round(w.preferredShare * 100),
    current: Math.round(w.currentShare * 100),
  }));

  return (
    <div className="h-[360px] w-full rounded-xl border border-[var(--border)] bg-white px-2 py-4 sm:px-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e2dc" />
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="#8a8a84" fontSize={12} />
          <YAxis type="category" dataKey="name" width={120} stroke="#5c5c57" fontSize={12} />
          <Tooltip
            formatter={(value) => `${value}%`}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e4e2dc",
              fontSize: 13,
            }}
          />
          <Legend />
          <Bar dataKey="preferred" name="Нам близко" fill="#2f4f4a" radius={[0, 4, 4, 0]} barSize={12} />
          <Bar dataKey="current" name="Так устроены сегодня" fill="#a8b5b2" radius={[0, 4, 4, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
