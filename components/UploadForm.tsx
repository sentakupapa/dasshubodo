'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type UploadResult = {
  ok?: boolean;
  period?: number;
  storeCount?: number;
  salesRows?: number;
  item14Rows?: number;
  processingRows?: number;
  error?: string;
};

export default function UploadForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const periodRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    const period = periodRef.current?.value;
    if (!file || !period) return;

    setSubmitting(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('period', period);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json: UploadResult = await res.json();
      setResult(json);
      if (res.ok) {
        router.refresh();
      }
    } catch {
      setResult({ error: 'アップロード中にエラーが発生しました' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            このExcelは第何期のデータですか？
          </label>
          <input
            ref={periodRef}
            type="number"
            min={1}
            step={1}
            required
            placeholder="例: 36"
            className="block w-32 border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <p className="text-xs text-slate-500 mt-1">
            シート内の「本年」列がこの期、「前年」列は自動的に1つ前の期として取り込まれます。
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Excelファイル（.xlsx）
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            required
            className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-slate-900 file:text-white file:text-sm hover:file:bg-slate-800"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="self-start px-4 py-2 bg-slate-900 text-white rounded-md text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? 'アップロード中...' : 'アップロード'}
        </button>
      </form>

      {result && (
        <div className="mt-4 text-sm">
          {result.ok ? (
            <p className="text-green-700">
              第{result.period}期として取り込み完了：店舗 {result.storeCount}件 / 売上データ{' '}
              {result.salesRows}行 / 14項目データ {result.item14Rows}行 / 加工データ{' '}
              {result.processingRows}行
            </p>
          ) : (
            <p className="text-red-700">{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
