import type { RecordRow } from './db';

export type AnnualPoint = {
  period: string; // YYYY-MM
  monthlyValue: number;
  annualTotal: number | null; // null until 12 months of window are available
};

export type SeriesAnnual = {
  series: string;
  points: AnnualPoint[];
};

function parsePeriod(period: string): { year: number; month: number } {
  const [y, m] = period.split('-').map(Number);
  return { year: y, month: m };
}

function periodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

/**
 * Builds a continuous monthly series (filling gaps with 0) and computes the
 * trailing 12-month moving annual total for each month once a full 12-month
 * window is available.
 */
export function computeMovingAnnualTotal(records: RecordRow[]): AnnualPoint[] {
  if (records.length === 0) return [];

  const valueByPeriod = new Map<string, number>();
  for (const r of records) {
    valueByPeriod.set(r.period, (valueByPeriod.get(r.period) ?? 0) + r.value);
  }

  const periods = [...valueByPeriod.keys()].sort();
  const first = parsePeriod(periods[0]);
  const last = parsePeriod(periods[periods.length - 1]);

  const continuous: string[] = [];
  let cursor = { year: first.year, month: first.month };
  while (periodKey(cursor.year, cursor.month) <= periodKey(last.year, last.month)) {
    continuous.push(periodKey(cursor.year, cursor.month));
    cursor = addMonths(cursor.year, cursor.month, 1);
  }

  const points: AnnualPoint[] = continuous.map((period) => ({
    period,
    monthlyValue: valueByPeriod.get(period) ?? 0,
    annualTotal: null,
  }));

  let windowSum = 0;
  for (let i = 0; i < points.length; i++) {
    windowSum += points[i].monthlyValue;
    if (i >= 12) {
      windowSum -= points[i - 12].monthlyValue;
    }
    if (i >= 11) {
      points[i].annualTotal = windowSum;
    }
  }

  return points;
}

export function computeAllSeriesAnnual(records: RecordRow[]): SeriesAnnual[] {
  const bySeries = new Map<string, RecordRow[]>();
  for (const r of records) {
    if (!bySeries.has(r.series)) bySeries.set(r.series, []);
    bySeries.get(r.series)!.push(r);
  }
  return [...bySeries.entries()].map(([series, rows]) => ({
    series,
    points: computeMovingAnnualTotal(rows),
  }));
}
