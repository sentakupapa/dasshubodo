import Papa from 'papaparse';
import type { RecordRow } from './db';

const PERIOD_HEADERS = ['period', 'date', '日付', '年月', 'month'];
const SERIES_HEADERS = ['series', 'category', '系列', 'カテゴリ', '項目'];
const VALUE_HEADERS = ['value', 'amount', '数値', '金額', '値'];

export type ParseResult = {
  rows: RecordRow[];
  errors: string[];
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase();
}

function findColumn(headers: string[], candidates: string[]): string | null {
  const normalized = headers.map(normalizeHeader);
  for (const c of candidates) {
    const idx = normalized.indexOf(c.toLowerCase());
    if (idx !== -1) return headers[idx];
  }
  return null;
}

/**
 * Normalizes a date-ish string into YYYY-MM. Accepts YYYY-MM, YYYY/MM,
 * YYYY-MM-DD, YYYY/MM/DD.
 */
function normalizePeriod(raw: string): string | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?$/);
  if (!match) return null;
  const year = match[1];
  const month = match[2].padStart(2, '0');
  return `${year}-${month}`;
}

export function parseCsv(content: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  });

  const errors: string[] = [];
  const headers = parsed.meta.fields ?? [];

  const periodCol = findColumn(headers, PERIOD_HEADERS);
  const seriesCol = findColumn(headers, SERIES_HEADERS);
  const valueCol = findColumn(headers, VALUE_HEADERS);

  if (!periodCol || !seriesCol || !valueCol) {
    errors.push(
      `必要な列が見つかりません。日付/系列/数値に相当する列（例: 日付,系列,数値 または date,series,value）が必要です。検出したヘッダー: ${headers.join(', ') || '(なし)'}`
    );
    return { rows: [], errors };
  }

  const rows: RecordRow[] = [];
  parsed.data.forEach((row, idx) => {
    const lineNo = idx + 2; // account for header row
    const rawPeriod = row[periodCol];
    const rawSeries = row[seriesCol];
    const rawValue = row[valueCol];

    if (!rawPeriod || !rawSeries || rawValue === undefined || rawValue === '') {
      errors.push(`${lineNo}行目: 値が不足しています`);
      return;
    }

    const period = normalizePeriod(rawPeriod);
    if (!period) {
      errors.push(`${lineNo}行目: 日付の形式が不正です（例: 2025-01）: "${rawPeriod}"`);
      return;
    }

    const value = Number(String(rawValue).replace(/,/g, ''));
    if (Number.isNaN(value)) {
      errors.push(`${lineNo}行目: 数値に変換できません: "${rawValue}"`);
      return;
    }

    rows.push({ series: rawSeries.trim(), period, value });
  });

  return { rows, errors };
}
