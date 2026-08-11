'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SeriesSelector from './SeriesSelector';
import AnnualChart from './AnnualChart';
import DataTable from './DataTable';
import type { SeriesAnnual } from '@/lib/annual';

export default function DashboardClient() {
  const [allSeries, setAllSeries] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [data, setData] = useState<SeriesAnnual[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/series')
      .then((r) => r.json())
      .then((json) => {
        setAllSeries(json.series);
        setSelected(json.series.slice(0, 5));
        setLoading(false);
      });
  }, []);

  const query = useMemo(() => selected.join(','), [selected]);

  useEffect(() => {
    if (selected.length === 0) {
      setData([]);
      return;
    }
    fetch(`/api/data?series=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((json) => setData(json.series));
  }, [query, selected.length]);

  if (loading) {
    return <p className="text-slate-500 text-sm">読み込み中...</p>;
  }

  if (allSeries.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center">
        <p className="text-slate-600 mb-4">
          まだデータがアップロードされていません。CSVをアップロードして年計表を作成しましょう。
        </p>
        <Link
          href="/upload"
          className="inline-block px-4 py-2 bg-slate-900 text-white rounded-md text-sm hover:bg-slate-800"
        >
          CSVをアップロードする
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-sm font-medium text-slate-600 mb-2">系列を選択</h2>
        <SeriesSelector allSeries={allSeries} selected={selected} onChange={setSelected} />
      </div>
      <AnnualChart seriesData={data} />
      <DataTable seriesData={data} />
    </div>
  );
}
