import { NextRequest, NextResponse } from 'next/server';
import { parseWorkbook, XlsxParseError } from '@/lib/xlsx-parser';
import { replaceAllData } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Excelファイルが指定されていません' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const payload = await parseWorkbook(buffer, file.name);
    replaceAllData(payload);

    return NextResponse.json({
      ok: true,
      storeCount: payload.stores.length,
      salesRows: payload.sales.length,
      item14Rows: payload.item14.length,
      processingRows: payload.processing.length,
    });
  } catch (err) {
    if (err instanceof XlsxParseError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Excelファイルの読み込み中にエラーが発生しました。ファイル形式を確認してください。' },
      { status: 400 }
    );
  }
}
