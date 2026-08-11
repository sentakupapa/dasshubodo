'use client';

import type { SeriesAnnual } from '@/lib/annual';

type Props = {
  seriesData: SeriesAnnual[];
};

const fmt = new Intl.NumberFormat('ja-JP');

export default function DataTable({ seriesData }: Props) {
  if (seriesData.length === 0) return null;

  const periodSet = new Set<string>();
  seriesData.forEach((s) => s.points.forEach((p) => periodSet.add(p.period)));
  const periods = [...periodSet].sort().reverse();

  return (
    <div className="overflow-x-auto bg-white border rounded-lg mt-6">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b">
            <th className="text-left px-4 py-2 font-medium text-slate-600">年月</th>
            {seriesData.map((s) => (
              <th key={s.series} className="text-right px-4 py-2 font-medium text-slate-600">
                {s.series}（年計）
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => (
            <tr key={period} className="border-b last:border-0 hover:bg-slate-50">
              <td className="px-4 py-2 text-slate-700">{period}</td>
              {seriesData.map((s) => {
                const point = s.points.find((p) => p.period === period);
                return (
                  <td key={s.series} className="px-4 py-2 text-right tabular-nums">
                    {point?.annualTotal != null ? fmt.format(point.annualTotal) : '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
