import { NextRequest, NextResponse } from 'next/server';
import { getSalesRecords, getItem14Records, getProcessingRecords } from '@/lib/db';
import { buildStoreReport } from '@/lib/report';
import { ensureSeeded } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const store = req.nextUrl.searchParams.get('store');
  if (!store) {
    return NextResponse.json({ error: '店舗を指定してください' }, { status: 400 });
  }

  await ensureSeeded();
  const sales = getSalesRecords(store);
  const item14 = getItem14Records(store);
  const processing = getProcessingRecords(store);

  return NextResponse.json(buildStoreReport(store, sales, item14, processing));
}
