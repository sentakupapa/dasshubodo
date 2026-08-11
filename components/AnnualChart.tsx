'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SeriesAnnual } from '@/lib/annual';

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777'];

type Props = {
  seriesData: SeriesAnnual[];
};

export default function AnnualChart({ seriesData }: Props) {
  const periodSet = new Set<string>();
  seriesData.forEach((s) => s.points.forEach((p) => periodSet.add(p.period)));
  const periods = [...periodSet].sort();

  const merged = periods.map((period) => {
    const row: Record<string, string | number | null> = { period };
    for (const s of seriesData) {
      const point = s.points.find((p) => p.period === period);
      row[s.series] = point?.annualTotal ?? null;
    }
    return row;
  });

  if (seriesData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-slate-400 text-sm border rounded-lg bg-white">
        系列を選択してください
      </div>
    );
  }

  return (
    <div className="h-96 bg-white border rounded-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={merged} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="period" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => new Intl.NumberFormat('ja-JP').format(v)}
          />
          <Tooltip
            formatter={(value: number) => new Intl.NumberFormat('ja-JP').format(value)}
          />
          <Legend />
          {seriesData.map((s, i) => (
            <Line
              key={s.series}
              type="monotone"
              dataKey={s.series}
              stroke={COLORS[i % COLORS.length]}
              connectNulls
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
