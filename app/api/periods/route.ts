import { NextResponse } from 'next/server';
import { listPeriods } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function GET() {
  await ensureSeeded();
  return NextResponse.json({ periods: listPeriods() });
}
