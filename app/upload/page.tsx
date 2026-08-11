import UploadForm from '@/components/UploadForm';

export default function UploadPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Excelアップロード</h1>
        <p className="text-sm text-slate-500 mt-1">
          店舗別の月次実績Excelをアップロードすると、年計表が自動的に更新されます。
        </p>
      </div>

      <div className="bg-slate-50 border rounded-lg p-4 mb-6 text-sm text-slate-600">
        <p className="font-medium text-slate-700 mb-2">必要なシート構成</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <code className="bg-white px-1 rounded border">店舗マスタ</code>：
            店舗名の一覧（列: 店舗名）
          </li>
          <li>
            <code className="bg-white px-1 rounded border">元データ</code>：
            店舗名・年区分（本年／前年）・月・項目・売上金額・商品点数・客数・利用数
          </li>
          <li>
            <code className="bg-white px-1 rounded border">元データ_14項目</code>：
            店舗名・年区分・月・品目別点数
          </li>
          <li>
            <code className="bg-white px-1 rounded border">元データ_加工</code>：
            店舗名・月・加工項目別点数（本年のみ）
          </li>
          <li>アップロードすると既存データはすべて置き換わります（差分更新ではなく全件置換）</li>
        </ul>
      </div>

      <UploadForm />
    </div>
  );
}
