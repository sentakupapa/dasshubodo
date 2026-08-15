import { NextRequest, NextResponse } from 'next/server';
import { parseWorkbook, XlsxParseError } from '@/lib/xlsx-parser';
import { upsertPeriodData } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');
  const periodRaw = formData.get('period');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Excelファイルが指定されていません' }, { status: 400 });
  }

  const period = Number(periodRaw);
  if (!Number.isInteger(period) || period < 1) {
    return NextResponse.json({ error: '期（何期のデータか）を1以上の整数で指定してください' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const payload = await parseWorkbook(buffer, file.name, period);
    upsertPeriodData(payload);

    return NextResponse.json({
      ok: true,
      period,
      storeCount: payload.stores.length,
      salesRows: payload.sales.length,
      item14Rows: payload.item14.length,
      processingRows: payload.processing.length,
    });
  } catch (err) {
    if (err instanceof XlsxParseError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Excelファイルの読み込み中にエラーが発生しました: ${detail}` },
      { status: 400 }
    );
  }
}
