import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

declare global {
  // eslint-disable-next-line no-var
  var __db__: Database.Database | undefined;
}

function createDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store TEXT NOT NULL,
      period INTEGER NOT NULL,
      month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
      item TEXT NOT NULL,
      sales_amount REAL,
      item_count REAL,
      customer_count REAL,
      usage_count REAL,
      UNIQUE(store, period, month, item)
    );
    CREATE INDEX IF NOT EXISTS idx_sales_store_period ON sales_records(store, period);

    CREATE TABLE IF NOT EXISTS item14_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store TEXT NOT NULL,
      period INTEGER NOT NULL,
      month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
      item TEXT NOT NULL,
      point_count REAL NOT NULL,
      UNIQUE(store, period, month, item)
    );
    CREATE INDEX IF NOT EXISTS idx_item14_store_period ON item14_records(store, period);

    CREATE TABLE IF NOT EXISTS processing_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store TEXT NOT NULL,
      period INTEGER NOT NULL,
      month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
      item TEXT NOT NULL,
      point_count REAL NOT NULL,
      UNIQUE(store, period, month, item)
    );
    CREATE INDEX IF NOT EXISTS idx_processing_store_period ON processing_records(store, period);

    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      period INTEGER NOT NULL,
      store_count INTEGER NOT NULL,
      sales_rows INTEGER NOT NULL,
      item14_rows INTEGER NOT NULL,
      processing_rows INTEGER NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

export function getDb(): Database.Database {
  if (!global.__db__) {
    global.__db__ = createDb();
  }
  return global.__db__;
}

export type SalesRow = {
  store: string;
  period: number;
  month: number;
  item: string;
  salesAmount: number | null;
  itemCount: number | null;
  customerCount: number | null;
  usageCount: number | null;
};

export type Item14Row = {
  store: string;
  period: number;
  month: number;
  item: string;
  pointCount: number;
};

export type ProcessingRow = {
  store: string;
  period: number;
  month: number;
  item: string;
  pointCount: number;
};

export type ImportPayload = {
  filename: string;
  /** The fiscal period (期) that this upload's 本年 rows represent. 前年 rows are stored as period-1. */
  period: number;
  stores: string[];
  sales: SalesRow[];
  item14: Item14Row[];
  processing: ProcessingRow[];
};

/**
 * Stores one upload's data. Only replaces the fiscal periods actually
 * present in this payload (the target period, and period-1 from 前年
 * rows), so uploading a new period doesn't wipe older periods' history.
 * The store master is merged (new stores added, existing ones kept).
 */
export function upsertPeriodData(payload: ImportPayload): void {
  const db = getDb();

  const insertStoreIfNew = db.prepare(`
    INSERT INTO stores (name, sort_order) VALUES (?, ?)
    ON CONFLICT(name) DO NOTHING
  `);
  const insertSales = db.prepare(`
    INSERT INTO sales_records (store, period, month, item, sales_amount, item_count, customer_count, usage_count)
    VALUES (@store, @period, @month, @item, @salesAmount, @itemCount, @customerCount, @usageCount)
    ON CONFLICT(store, period, month, item) DO UPDATE SET
      sales_amount = excluded.sales_amount,
      item_count = excluded.item_count,
      customer_count = excluded.customer_count,
      usage_count = excluded.usage_count
  `);
  const insertItem14 = db.prepare(`
    INSERT INTO item14_records (store, period, month, item, point_count)
    VALUES (@store, @period, @month, @item, @pointCount)
    ON CONFLICT(store, period, month, item) DO UPDATE SET point_count = excluded.point_count
  `);
  const insertProcessing = db.prepare(`
    INSERT INTO processing_records (store, period, month, item, point_count)
    VALUES (@store, @period, @month, @item, @pointCount)
    ON CONFLICT(store, period, month, item) DO UPDATE SET point_count = excluded.point_count
  `);
  const insertUpload = db.prepare(`
    INSERT INTO uploads (filename, period, store_count, sales_rows, item14_rows, processing_rows)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const deleteSalesForPeriod = db.prepare(`DELETE FROM sales_records WHERE period = ?`);
  const deleteItem14ForPeriod = db.prepare(`DELETE FROM item14_records WHERE period = ?`);
  const deleteProcessingForPeriod = db.prepare(`DELETE FROM processing_records WHERE period = ?`);

  const tx = db.transaction((p: ImportPayload) => {
    p.stores.forEach((name, i) => insertStoreIfNew.run(name, i));

    const periodsInPayload = new Set(p.sales.map((r) => r.period));
    periodsInPayload.add(p.period);
    for (const per of periodsInPayload) {
      deleteSalesForPeriod.run(per);
      deleteItem14ForPeriod.run(per);
    }
    deleteProcessingForPeriod.run(p.period);

    for (const row of p.sales) insertSales.run(row);
    for (const row of p.item14) insertItem14.run(row);
    for (const row of p.processing) insertProcessing.run(row);

    insertUpload.run(p.filename, p.period, p.stores.length, p.sales.length, p.item14.length, p.processing.length);
  });

  tx(payload);
}

export function listStores(): string[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT name FROM stores ORDER BY sort_order ASC`)
    .all() as { name: string }[];
  if (rows.length > 0) return rows.map((r) => r.name);

  const fallback = db
    .prepare(`SELECT DISTINCT store FROM sales_records ORDER BY store ASC`)
    .all() as { store: string }[];
  return fallback.map((r) => r.store);
}

export function listPeriods(): number[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT DISTINCT period FROM sales_records ORDER BY period DESC`)
    .all() as { period: number }[];
  return rows.map((r) => r.period);
}

export function getSalesRecords(store: string, period: number): SalesRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT store, period, month, item,
              sales_amount as salesAmount, item_count as itemCount,
              customer_count as customerCount, usage_count as usageCount
       FROM sales_records WHERE store = ? AND period IN (?, ?)`
    )
    .all(store, period, period - 1) as SalesRow[];
}

export function getItem14Records(store: string, period: number): Item14Row[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT store, period, month, item, point_count as pointCount
       FROM item14_records WHERE store = ? AND period IN (?, ?)`
    )
    .all(store, period, period - 1) as Item14Row[];
}

export function getProcessingRecords(store: string, period: number): ProcessingRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT store, period, month, item, point_count as pointCount
       FROM processing_records WHERE store = ? AND period = ?`
    )
    .all(store, period) as ProcessingRow[];
}

export function hasAnyData(): boolean {
  const db = getDb();
  const row = db
    .prepare(`SELECT COUNT(*) as c FROM sales_records`)
    .get() as { c: number };
  return row.c > 0;
}
