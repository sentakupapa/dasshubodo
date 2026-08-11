import { NextRequest, NextResponse } from 'next/server';
import { parseCsv } from '@/lib/csv';
import { upsertRecords, recordUpload } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'CSVファイルが指定されていません' }, { status: 400 });
  }

  const content = await file.text();
  const { rows, errors } = parseCsv(content);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: '取り込めるデータがありませんでした', details: errors },
      { status: 400 }
    );
  }

  upsertRecords(rows);
  recordUpload(file.name, rows.length);

  return NextResponse.json({
    ok: true,
    importedRows: rows.length,
    warnings: errors,
  });
}
