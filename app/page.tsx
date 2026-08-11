import DashboardClient from '@/components/DashboardClient';

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">年計表ダッシュボード</h1>
        <p className="text-sm text-slate-500 mt-1">
          会計年度（8月〜7月）ごとの年計と前年比を店舗別に確認できます。
        </p>
      </div>
      <DashboardClient />
    </div>
  );
}
