import { NextResponse } from 'next/server';
import { listSeries } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const series = listSeries();
  return NextResponse.json({ series });
}
