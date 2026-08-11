import DashboardClient from '@/components/DashboardClient';

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">年計表ダッシュボード</h1>
        <p className="text-sm text-slate-500 mt-1">
          過去12ヶ月の移動累計（年計）を月次で表示します。季節変動を除いたトレンドの確認に利用してください。
        </p>
      </div>
      <DashboardClient />
    </div>
  );
}
