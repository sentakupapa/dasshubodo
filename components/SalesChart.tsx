'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnnualRow } from '@/lib/report';

const FISCAL_MONTHS = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7];

export default function SalesChart({ row }: { row: AnnualRow }) {
  const data = FISCAL_MONTHS.map((m, i) => ({
    month: `${m}月`,
    本年: row.thisYear[i],
    前年: row.lastYear?.[i] ?? 0,
  }));

  return (
    <div className="h-72 bg-white border rounded-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => new Intl.NumberFormat('ja-JP', { notation: 'compact' }).format(v)}
          />
          <Tooltip formatter={(value: number) => new Intl.NumberFormat('ja-JP').format(value)} />
          <Legend />
          <Bar dataKey="前年" fill="#94a3b8" radius={[3, 3, 0, 0]} />
          <Bar dataKey="本年" fill="#2563eb" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
