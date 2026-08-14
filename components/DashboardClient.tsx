'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StoreSelector from './StoreSelector';
import PeriodSelector from './PeriodSelector';
import AnnualTable from './AnnualTable';
import SalesChart from './SalesChart';
import type { StoreReport } from '@/lib/report';

export default function DashboardClient() {
  const [stores, setStores] = useState<string[]>([]);
  const [periods, setPeriods] = useState<number[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [report, setReport] = useState<StoreReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/stores').then((r) => r.json()),
      fetch('/api/periods').then((r) => r.json()),
    ]).then(([storesJson, periodsJson]) => {
      setStores(storesJson.stores);
      if (storesJson.stores.length > 0) setSelectedStore(storesJson.stores[0]);
      setPeriods(periodsJson.periods);
      if (periodsJson.periods.length > 0) setSelectedPeriod(periodsJson.periods[0]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedStore || selectedPeriod === null) return;
    fetch(`/api/report?store=${encodeURIComponent(selectedStore)}&period=${selectedPeriod}`)
      .then((r) => r.json())
      .then((json) => setReport(json));
  }, [selectedStore, selectedPeriod]);

  if (loading) {
    return <p className="text-slate-500 text-sm">読み込み中...</p>;
  }

  if (stores.length === 0 || periods.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center">
        <p className="text-slate-600 mb-4">
          まだデータがアップロードされていません。Excelファイルをアップロードして年計表を作成しましょう。
        </p>
        <Link
          href="/upload"
          className="inline-block px-4 py-2 bg-slate-900 text-white rounded-md text-sm hover:bg-slate-800"
        >
          Excelをアップロードする
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600">店舗</label>
          <StoreSelector stores={stores} selected={selectedStore} onChange={setSelectedStore} />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600">期</label>
          <PeriodSelector
            periods={periods}
            selected={selectedPeriod ?? periods[0]}
            onChange={setSelectedPeriod}
          />
        </div>
      </div>

      {!report ? (
        <p className="text-slate-500 text-sm">読み込み中...</p>
      ) : (
        <div className="flex flex-col gap-6">
          {report.salesAmount.rows[0] && <SalesChart row={report.salesAmount.rows[0]} />}
          <AnnualTable section={report.salesAmount} />
          <AnnualTable section={report.itemCount} />
          <AnnualTable section={report.usageCount} />
          <AnnualTable section={report.item14} />
          <AnnualTable section={report.processing} />
        </div>
      )}
    </div>
  );
}
