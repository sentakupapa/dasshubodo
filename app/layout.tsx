import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: '年計表ダッシュボード',
  description: '社内スタッフ向け年計表（移動年計）ダッシュボード',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b bg-white">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              <Link href="/" className="text-lg font-semibold text-slate-800">
                年計表ダッシュボード
              </Link>
              <nav className="flex gap-4 text-sm">
                <Link href="/" className="text-slate-600 hover:text-slate-900">
                  ダッシュボード
                </Link>
                <Link href="/upload" className="text-slate-600 hover:text-slate-900">
                  CSVアップロード
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
          </main>
          <footer className="border-t bg-white text-center text-xs text-slate-400 py-4">
            社内向け年計表ダッシュボード
          </footer>
        </div>
      </body>
    </html>
  );
}
