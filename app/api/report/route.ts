import { NextRequest, NextResponse } from 'next/server';
import { getSalesRecords, getItem14Records, getProcessingRecords, listPeriods } from '@/lib/db';
import { buildStoreReport } from '@/lib/report';
import { ensureSeeded } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const store = req.nextUrl.searchParams.get('store');
  if (!store) {
    return NextResponse.json({ error: '店舗を指定してください' }, { status: 400 });
  }

  await ensureSeeded();

  const periodParam = req.nextUrl.searchParams.get('period');
  let period = periodParam ? Number(periodParam) : NaN;
  if (!Number.isInteger(period)) {
    const periods = listPeriods();
    if (periods.length === 0) {
      return NextResponse.json({ error: 'データがありません' }, { status: 404 });
    }
    period = periods[0];
  }

  const sales = getSalesRecords(store, period);
  const item14 = getItem14Records(store, period);
  const processing = getProcessingRecords(store, period);

  return NextResponse.json(buildStoreReport(store, period, sales, item14, processing));
}
