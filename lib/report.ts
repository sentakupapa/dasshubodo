import type { SalesRow, Item14Row, ProcessingRow } from './db';

export const FISCAL_MONTHS = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7];

export type AnnualRow = {
  label: string;
  thisYear: number[];
  lastYear: number[] | null;
  thisYearTotal: number;
  lastYearTotal: number | null;
  ratio: number | null;
};

export type AnnualSection = {
  title: string;
  hasComparison: boolean;
  ratioLabel: string;
  rows: AnnualRow[];
};

type FactTuple = { period: number; month: number; item: string; value: number };

function buildMonthlyArray(map: Map<number, number>): number[] {
  return FISCAL_MONTHS.map((m) => map.get(m) ?? 0);
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function buildRows(tuples: FactTuple[], period: number): AnnualRow[] {
  const byItem = new Map<string, FactTuple[]>();
  for (const t of tuples) {
    if (!byItem.has(t.item)) byItem.set(t.item, []);
    byItem.get(t.item)!.push(t);
  }

  const rows: AnnualRow[] = [];
  for (const [item, ts] of byItem) {
    const thisMap = new Map<number, number>();
    const lastMap = new Map<number, number>();
    for (const t of ts) {
      if (t.period === period) thisMap.set(t.month, t.value);
      else if (t.period === period - 1) lastMap.set(t.month, t.value);
    }
    const thisYear = buildMonthlyArray(thisMap);
    const lastYear = buildMonthlyArray(lastMap);
    const thisYearTotal = sum(thisYear);
    const lastYearTotal = sum(lastYear);
    rows.push({
      label: item,
      thisYear,
      lastYear,
      thisYearTotal,
      lastYearTotal,
      ratio: lastYearTotal > 0 ? thisYearTotal / lastYearTotal : null,
    });
  }
  return rows;
}

function buildRowsForSalesMetric(
  records: SalesRow[],
  period: number,
  metricKey: 'salesAmount' | 'itemCount' | 'usageCount' | 'customerCount'
): AnnualRow[] {
  const tuples: FactTuple[] = [];
  for (const r of records) {
    const value = r[metricKey];
    if (value === null) continue;
    tuples.push({ period: r.period, month: r.month, item: r.item, value });
  }
  return buildRows(tuples, period);
}

export function buildSalesAmountSection(records: SalesRow[], period: number): AnnualSection {
  return {
    title: '売上金額',
    hasComparison: true,
    ratioLabel: '前年比',
    rows: buildRowsForSalesMetric(records, period, 'salesAmount'),
  };
}

export function buildItemCountSection(records: SalesRow[], period: number): AnnualSection {
  return {
    title: '商品点数（ワイシャツ／ズボン／ジャケット）',
    hasComparison: true,
    ratioLabel: '前年比',
    rows: buildRowsForSalesMetric(records, period, 'itemCount').filter((r) => r.label !== '全体'),
  };
}

export function buildUsageCountSection(records: SalesRow[], period: number): AnnualSection {
  return {
    title: '利用数（アプリ／BD／ダイヤモンド）',
    hasComparison: true,
    ratioLabel: '前年比',
    rows: buildRowsForSalesMetric(records, period, 'usageCount'),
  };
}

export function buildItem14Section(records: Item14Row[], period: number): AnnualSection {
  const tuples: FactTuple[] = records.map((r) => ({
    period: r.period,
    month: r.month,
    item: r.item,
    value: r.pointCount,
  }));
  return {
    title: '14項目 年計表（点数）',
    hasComparison: true,
    ratioLabel: '前年比',
    rows: buildRows(tuples, period),
  };
}

const DRY_CLEANING_ITEM = 'ドライ点数';

export function buildProcessingSection(records: ProcessingRow[]): AnnualSection {
  const byItem = new Map<string, Map<number, number>>();
  for (const r of records) {
    if (!byItem.has(r.item)) byItem.set(r.item, new Map());
    byItem.get(r.item)!.set(r.month, r.pointCount);
  }

  const dryTotal = byItem.has(DRY_CLEANING_ITEM)
    ? sum(buildMonthlyArray(byItem.get(DRY_CLEANING_ITEM)!))
    : null;

  const rows: AnnualRow[] = [];
  for (const [item, monthMap] of byItem) {
    const thisYear = buildMonthlyArray(monthMap);
    const thisYearTotal = sum(thisYear);
    rows.push({
      label: item,
      thisYear,
      lastYear: null,
      thisYearTotal,
      lastYearTotal: null,
      ratio: dryTotal ? thisYearTotal / dryTotal : null,
    });
  }

  return {
    title: '加工 年計表（点数、本期のみ）',
    hasComparison: false,
    ratioLabel: '対ドライ比',
    rows,
  };
}

export type StoreReport = {
  store: string;
  period: number;
  salesAmount: AnnualSection;
  itemCount: AnnualSection;
  usageCount: AnnualSection;
  item14: AnnualSection;
  processing: AnnualSection;
};

export function buildStoreReport(
  store: string,
  period: number,
  sales: SalesRow[],
  item14: Item14Row[],
  processing: ProcessingRow[]
): StoreReport {
  return {
    store,
    period,
    salesAmount: buildSalesAmountSection(sales, period),
    itemCount: buildItemCountSection(sales, period),
    usageCount: buildUsageCountSection(sales, period),
    item14: buildItem14Section(item14, period),
    processing: buildProcessingSection(processing),
  };
}
