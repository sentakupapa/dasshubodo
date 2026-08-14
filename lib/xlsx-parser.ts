import ExcelJS from 'exceljs';
import type { ImportPayload, SalesRow, Item14Row, ProcessingRow } from './db';

const SHEET_STORES = '店舗マスタ';
const SHEET_SALES = '元データ';
const SHEET_ITEM14 = '元データ_14項目';
const SHEET_PROCESSING = '元データ_加工';

export class XlsxParseError extends Error {}

function cellValue(v: ExcelJS.CellValue): string | number | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    const obj = v as unknown as Record<string, unknown>;
    if ('result' in obj) return cellValue(obj.result as ExcelJS.CellValue);
    if ('text' in obj) return String(obj.text ?? '');
    if ('richText' in obj && Array.isArray(obj.richText)) {
      return (obj.richText as { text: string }[]).map((t) => t.text).join('');
    }
    return null;
  }
  return v as string | number;
}

function toText(v: ExcelJS.CellValue): string {
  const val = cellValue(v);
  if (val === null) return '';
  return String(val).trim();
}

function toNumberOrNull(v: ExcelJS.CellValue): number | null {
  const val = cellValue(v);
  if (val === null || val === '') return null;
  const n = typeof val === 'number' ? val : Number(String(val).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function getSheet(wb: ExcelJS.Workbook, name: string): ExcelJS.Worksheet {
  const sheet = wb.getWorksheet(name);
  if (!sheet) {
    const available = wb.worksheets.map((s) => s.name).join(', ');
    throw new XlsxParseError(
      `シート「${name}」が見つかりません。取り込むには次の4シートが必要です: ${SHEET_STORES}, ${SHEET_SALES}, ${SHEET_ITEM14}, ${SHEET_PROCESSING}（検出したシート: ${available}）`
    );
  }
  return sheet;
}

function headerIndexMap(sheet: ExcelJS.Worksheet, headerRow = 1): Map<string, number> {
  const map = new Map<string, number>();
  const row = sheet.getRow(headerRow);
  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const text = toText(cell.value);
    if (text) map.set(text, colNumber);
  });
  return map;
}

function requireColumn(map: Map<string, number>, name: string, sheetName: string): number {
  const idx = map.get(name);
  if (!idx) {
    throw new XlsxParseError(`シート「${sheetName}」に列「${name}」が見つかりません`);
  }
  return idx;
}

function parseStores(wb: ExcelJS.Workbook): string[] {
  const sheet = getSheet(wb, SHEET_STORES);
  const headers = headerIndexMap(sheet);
  const nameCol = requireColumn(headers, '店舗名', SHEET_STORES);

  const stores: string[] = [];
  const seen = new Set<string>();
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const name = toText(row.getCell(nameCol).value);
    if (!name || seen.has(name)) return;
    seen.add(name);
    stores.push(name);
  });
  return stores;
}

function parseSales(wb: ExcelJS.Workbook, targetPeriod: number): SalesRow[] {
  const sheet = getSheet(wb, SHEET_SALES);
  const headers = headerIndexMap(sheet);
  const storeCol = requireColumn(headers, '店舗名', SHEET_SALES);
  const yearCol = requireColumn(headers, '年区分', SHEET_SALES);
  const monthCol = requireColumn(headers, '月', SHEET_SALES);
  const itemCol = requireColumn(headers, '項目', SHEET_SALES);
  const salesCol = headers.get('売上金額');
  const itemCountCol = headers.get('商品点数');
  const customerCol = headers.get('客数');
  const usageCol = headers.get('利用数');

  const rows: SalesRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const store = toText(row.getCell(storeCol).value);
    const yearType = toText(row.getCell(yearCol).value);
    const month = toNumberOrNull(row.getCell(monthCol).value);
    const item = toText(row.getCell(itemCol).value);

    if (!store || !item) return;
    if (yearType !== '本年' && yearType !== '前年') return;
    if (month === null || month < 1 || month > 12) return;

    rows.push({
      store,
      period: yearType === '本年' ? targetPeriod : targetPeriod - 1,
      month,
      item,
      salesAmount: salesCol ? toNumberOrNull(row.getCell(salesCol).value) : null,
      itemCount: itemCountCol ? toNumberOrNull(row.getCell(itemCountCol).value) : null,
      customerCount: customerCol ? toNumberOrNull(row.getCell(customerCol).value) : null,
      usageCount: usageCol ? toNumberOrNull(row.getCell(usageCol).value) : null,
    });
  });
  return rows;
}

const FIXED_SALES_HEADERS = new Set(['店舗名', '年区分', '月']);
const FIXED_PROCESSING_HEADERS = new Set(['店舗名', '月']);

function parseItem14(wb: ExcelJS.Workbook, targetPeriod: number): Item14Row[] {
  const sheet = getSheet(wb, SHEET_ITEM14);
  const headers = headerIndexMap(sheet);
  const storeCol = requireColumn(headers, '店舗名', SHEET_ITEM14);
  const yearCol = requireColumn(headers, '年区分', SHEET_ITEM14);
  const monthCol = requireColumn(headers, '月', SHEET_ITEM14);
  const itemCols = [...headers.entries()].filter(([name]) => !FIXED_SALES_HEADERS.has(name));

  const rows: Item14Row[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const store = toText(row.getCell(storeCol).value);
    const yearType = toText(row.getCell(yearCol).value);
    const month = toNumberOrNull(row.getCell(monthCol).value);
    if (!store) return;
    if (yearType !== '本年' && yearType !== '前年') return;
    if (month === null || month < 1 || month > 12) return;

    const period = yearType === '本年' ? targetPeriod : targetPeriod - 1;
    for (const [item, col] of itemCols) {
      const pointCount = toNumberOrNull(row.getCell(col).value);
      if (pointCount === null) continue;
      rows.push({ store, period, month, item, pointCount });
    }
  });
  return rows;
}

function parseProcessing(wb: ExcelJS.Workbook, targetPeriod: number): ProcessingRow[] {
  const sheet = getSheet(wb, SHEET_PROCESSING);
  const headers = headerIndexMap(sheet);
  const storeCol = requireColumn(headers, '店舗名', SHEET_PROCESSING);
  const monthCol = requireColumn(headers, '月', SHEET_PROCESSING);
  const itemCols = [...headers.entries()].filter(([name]) => !FIXED_PROCESSING_HEADERS.has(name));

  const rows: ProcessingRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const store = toText(row.getCell(storeCol).value);
    const month = toNumberOrNull(row.getCell(monthCol).value);
    if (!store) return;
    if (month === null || month < 1 || month > 12) return;

    for (const [item, col] of itemCols) {
      const pointCount = toNumberOrNull(row.getCell(col).value);
      if (pointCount === null) continue;
      rows.push({ store, period: targetPeriod, month, item, pointCount });
    }
  });
  return rows;
}

export async function parseWorkbook(
  buffer: Buffer,
  filename: string,
  targetPeriod: number
): Promise<ImportPayload> {
  if (!Number.isInteger(targetPeriod) || targetPeriod < 1) {
    throw new XlsxParseError('期は1以上の整数で指定してください');
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const stores = parseStores(wb);
  const sales = parseSales(wb, targetPeriod);
  const item14 = parseItem14(wb, targetPeriod);
  const processing = parseProcessing(wb, targetPeriod);

  if (sales.length === 0) {
    throw new XlsxParseError('元データシートから有効な行を取り込めませんでした');
  }

  return { filename, period: targetPeriod, stores, sales, item14, processing };
}
