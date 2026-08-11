import { NextRequest, NextResponse } from 'next/server';
import { getRecordsBySeries } from '@/lib/db';
import { computeAllSeriesAnnual } from '@/lib/annual';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const seriesParam = req.nextUrl.searchParams.get('series');
  const series = seriesParam ? seriesParam.split(',').filter(Boolean) : [];

  const records = getRecordsBySeries(series);
  const result = computeAllSeriesAnnual(records);

  return NextResponse.json({ series: result });
}
