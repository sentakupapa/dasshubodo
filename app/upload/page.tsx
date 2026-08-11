import UploadForm from '@/components/UploadForm';

export default function UploadPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">CSVアップロード</h1>
        <p className="text-sm text-slate-500 mt-1">
          月次データをCSVでアップロードすると、自動的に年計（過去12ヶ月移動累計）が計算されます。
        </p>
      </div>

      <div className="bg-slate-50 border rounded-lg p-4 mb-6 text-sm text-slate-600">
        <p className="font-medium text-slate-700 mb-2">CSVフォーマット</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            列: <code className="bg-white px-1 rounded border">日付</code>（例: 2024-01）,{' '}
            <code className="bg-white px-1 rounded border">系列</code>（データの分類名）,{' '}
            <code className="bg-white px-1 rounded border">数値</code>
          </li>
          <li>英語ヘッダー（date, series, value）も利用可能です</li>
          <li>同じ系列・年月のデータを再アップロードすると上書きされます</li>
        </ul>
        <a href="/template.csv" download className="inline-block mt-3 text-blue-600 hover:underline">
          サンプルCSVをダウンロード
        </a>
      </div>

      <UploadForm />
    </div>
  );
}
