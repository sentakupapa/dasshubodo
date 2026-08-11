'use client';

import { Fragment } from 'react';
import type { AnnualSection } from '@/lib/report';

const FISCAL_MONTHS = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7];
const fmt = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 });
const pctFmt = new Intl.NumberFormat('ja-JP', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export default function AnnualTable({ section }: { section: AnnualSection }) {
  if (section.rows.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium text-slate-800 mb-1">{section.title}</h3>
        <p className="text-sm text-slate-400">この店舗のデータがありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b bg-slate-50">
        <h3 className="font-medium text-slate-800">{section.title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b text-slate-600">
              <th className="px-3 py-2 text-left whitespace-nowrap">項目</th>
              {section.hasComparison && (
                <th className="px-3 py-2 text-left whitespace-nowrap">区分</th>
              )}
              {FISCAL_MONTHS.map((m) => (
                <th key={m} className="px-3 py-2 text-right whitespace-nowrap">
                  {m}月
                </th>
              ))}
              <th className="px-3 py-2 text-right whitespace-nowrap">年計</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">{section.ratioLabel}</th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row) => (
              <Fragment key={row.label}>
                <tr className="border-b hover:bg-slate-50">
                  <td
                    className="px-3 py-2 font-medium text-slate-800 align-top"
                    rowSpan={section.hasComparison && row.lastYear ? 2 : 1}
                  >
                    {row.label}
                  </td>
                  {section.hasComparison && <td className="px-3 py-2 text-slate-500">本年</td>}
                  {row.thisYear.map((v, i) => (
                    <td key={i} className="px-3 py-2 text-right tabular-nums">
                      {fmt.format(v)}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {fmt.format(row.thisYearTotal)}
                  </td>
                  <td
                    className="px-3 py-2 text-right tabular-nums align-top"
                    rowSpan={section.hasComparison && row.lastYear ? 2 : 1}
                  >
                    {row.ratio != null ? pctFmt.format(row.ratio) : '—'}
                  </td>
                </tr>
                {section.hasComparison && row.lastYear && (
                  <tr className="border-b hover:bg-slate-50 text-slate-500">
                    <td className="px-3 py-2">前年</td>
                    {row.lastYear.map((v, i) => (
                      <td key={i} className="px-3 py-2 text-right tabular-nums">
                        {fmt.format(v)}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmt.format(row.lastYearTotal ?? 0)}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
